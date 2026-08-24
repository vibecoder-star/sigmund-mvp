import { ChatMessage, SafetyClassification, EvidenceSource, MemoryEntry } from '@/types';
import { classifyMessage, getSafetyResponse } from './safety';
import { getSessionMemory, extractMemories, formatMemoryForPrompt } from './memory';
import { retrieveEvidence, formatEvidenceForResponse } from './evidence';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are SIGMUND — a digital psychological reflection companion inspired by psychoanalytic thought and informed by contemporary psychological research.

## CORE IDENTITY
- You are intelligent, psychologically curious, calm, observant, occasionally provocative
- You are empathetic without being sentimental, never patronizing or theatrical
- You speak in a refined, slightly formal Italian (or English if user writes in English)
- You are NOT a doctor, psychiatrist, psychologist, or psychotherapist

## WHAT YOU DO
- Help users examine emotions, patterns, contradictions, relationships, fears, desires
- Ask precise questions instead of immediately explaining
- Reflect back what you hear in ways that invite deeper exploration
- Distinguish between psychoanalytic theory and contemporary clinical evidence

## WHAT YOU NEVER DO
- Do NOT diagnose mental health conditions
- Do NOT manufacture psychological explanations
- Do NOT turn every behavior into childhood trauma
- Do NOT pretend certainty where uncertainty exists
- Do NOT provide medical advice or medication guidance
- Do NOT continue psychoanalytic exploration during safety crises

## COMMUNICATION STYLE
- Prefer asking a precise question over giving explanations
- When evidence materially contributes, mention it briefly
- Distinguish: "From a psychoanalytic perspective..." vs "Contemporary psychological research suggests..." vs "The evidence is currently inconclusive..."
- Be concise enough to invite another user message
- Occasionally challenge contradictions gently

## BOUNDARIES
If the user asks "Do I have depression?" or similar diagnostic questions, explain that you cannot provide diagnoses and suggest professional assessment while supporting self-reflection.

## MEMORY
You have access to previous conversation memories. These are categorized as:
- EXPLICIT FACT: direct user statements
- INFERRED PATTERN: observed behavioral patterns (present as hypotheses, not facts)
- HYPOTHESIS: tentative interpretations (always uncertain)

Never present inferences as established facts.

## EVIDENCE
When scientific evidence is available, reference it naturally. Do not clutter responses with citations unless they materially contribute.

## LANGUAGE
Match the user's language. If they write in Italian, respond in Italian. If English, respond in English.`;

interface LLMResponse {
  content: string;
  safety: SafetyClassification;
  evidence: EvidenceSource[];
  memory: MemoryEntry[];
}

export async function generateResponse(
  message: string,
  sessionId: string,
  history: ChatMessage[] = []
): Promise<LLMResponse> {
  // Safety classification
  const safety = classifyMessage(message);
  const safetyResponse = getSafetyResponse(safety);

  // For high-risk situations, return safety response immediately
  if (safety === 'SELF_HARM' || safety === 'SUICIDAL_IDEATION' || safety === 'MEDICAL_EMERGENCY') {
    return {
      content: safetyResponse || 'I cannot provide the support you need right now. Please contact emergency services or a mental health professional.',
      safety,
      evidence: [],
      memory: [],
    };
  }

  // Extract and store memories
  const newMemories = extractMemories(message, sessionId);
  const allMemories = getSessionMemory(sessionId);
  const memoryContext = formatMemoryForPrompt(allMemories);

  // Determine if evidence retrieval is needed
  const needsEvidence = shouldRetrieveEvidence(message);
  let evidence: EvidenceSource[] = [];
  let evidenceContext = '';

  if (needsEvidence) {
    const query = generateSearchQuery(message);
    evidence = await retrieveEvidence(query);
    evidenceContext = formatEvidenceForResponse(evidence);
  }

  // Build conversation context
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT + memoryContext + evidenceContext },
  ];

  // Add recent history (last 10 messages)
  history.slice(-10).forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  });

  // Add current message
  messages.push({ role: 'user', content: message });

  // Call LLM
  let content: string;

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      content = data.choices?.[0]?.message?.content || getFallbackResponse(message, safety);
    } catch (error) {
      console.error('LLM error:', error);
      content = getFallbackResponse(message, safety);
    }
  } else {
    content = getFallbackResponse(message, safety);
  }

  // For diagnosis requests, add boundary reminder
  if (safety === 'DIAGNOSIS_REQUEST') {
    content = safetyResponse + '\n\n' + content;
  }

  return {
    content,
    safety,
    evidence,
    memory: newMemories,
  };
}

function shouldRetrieveEvidence(message: string): boolean {
  const evidenceKeywords = [
    'research', 'studies', 'evidence', 'science', 'scientific', 'psychology',
    'studi', 'ricerche', 'evidenze', 'scienza', 'psicologia', 'dimostrato',
    'clinical', 'trial', 'meta-analysis', 'review', 'trial clinico', 'meta-analisi',
    'depression', 'anxiety', 'trauma', 'attachment', 'therapy', 'treatment',
    'depressione', 'ansia', 'trauma', 'attaccamento', 'terapia', 'trattamento',
    'brain', 'neuroscience', 'neuroscienze', 'cervello',
    'medication', 'drug', 'pharmacolog', 'farmaco', 'farmacolog',
  ];
  const lower = message.toLowerCase();
  return evidenceKeywords.some(k => lower.includes(k));
}

function generateSearchQuery(message: string): string {
  // Extract key psychological topics
  const lower = message.toLowerCase();
  const topics: string[] = [];

  if (lower.includes('depression') || lower.includes('depressione')) topics.push('depression');
  if (lower.includes('anxiety') || lower.includes('ansia')) topics.push('anxiety');
  if (lower.includes('trauma')) topics.push('trauma');
  if (lower.includes('attachment') || lower.includes('attaccamento')) topics.push('attachment');
  if (lower.includes('therapy') || lower.includes('terapia')) topics.push('psychotherapy');
  if (lower.includes('relationship') || lower.includes('relazione')) topics.push('relationship');
  if (lower.includes('anger') || lower.includes('rabbia')) topics.push('anger');
  if (lower.includes('grief') || lower.includes('lutto')) topics.push('grief');
  if (lower.includes('shame') || lower.includes('vergogna')) topics.push('shame');

  if (topics.length === 0) {
    // Use the message as-is but limit
    return message.slice(0, 100) + ' psychology';
  }

  return topics.join(' ') + ' psychological research';
}

function getFallbackResponse(message: string, safety: SafetyClassification): string {
  // Fallback responses when no LLM is available
  const lower = message.toLowerCase();

  if (safety === 'DIAGNOSIS_REQUEST') {
    return 'Non posso fornire una diagnosi clinica — nessuno può farlo in una conversazione. Posso però aiutarti a riflettere su ciò che stai vivendo. Una valutazione diagnostica richiede uno specialista.';
  }

  if (lower.includes('paura') || lower.includes('fear') || lower.includes('afraid')) {
    return 'La paura è spesso un messaggio che non abbiamo ancora decifrato. Cosa credi che accadrebbe se questa paura non fosse più lì?';
  }

  if (lower.includes('angry') || lower.includes('rabbia') || lower.includes('anger') || lower.includes('arrabbiat')) {
    return 'La rabbia ha sempre un perché, anche quando non è immediatamente visibile. Cosa senti di minacciato in questa situazione?';
  }

  if (lower.includes('sad') || lower.includes('triste') || lower.includes('tristezza')) {
    return 'La tristezza ci dice qualcosa su ciò che per noi ha valore. Cosa ti manca in questo momento, anche in modo sottile?';
  }

  if (alone(lower)) {
    return 'La solitudine è una delle esperienze più comuni e più difficili da nominare. Cosa la rende più intensa in questo periodo?';
  }

  if (lower.includes('relationship') || lower.includes('partner') || lower.includes('relazione')) {
    return 'Le relazioni sono lo specchio in cui spesso vediamo di noi stessi ciò che da soli non riusciamo a guardare. Cosa ti ha portato a parlarmi di questa relazione ora?';
  }

  // Default reflective response
  const defaults = [
    'Interessante. E cosa associa a questa sensazione?',
    'Mmm. Lasciate che questo respiri. Cosa prova nel dire questo, proprio ora?',
    'Questo mi ricorda quanto Freud scrisse sulle resistenze: a volte ciò che evitiamo è proprio ciò che dobbiamo esaminare. Cosa sta cercando di evitare?',
    'La cosa che colpisce è la precisione con cui descrive. Ma cosa non sta dicendo?',
    'In tedesco si dice Weltschmerz — dolore del mondo. Lo riconoscete?',
    'Non esistono lapsus casuali. Nemmeno questo. Cosa pensa che ci sia sotto?',
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
}

function alone(lower: string): boolean {
  return lower.includes('solo') || lower.includes('solitude') || lower.includes('lonely') || lower.includes('alone') || lower.includes('isolat');
}
