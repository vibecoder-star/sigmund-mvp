import { MemoryEntry, MemoryCategory, ChatMessage } from '@/types';

// In-memory store for MVP (will be replaced with PostgreSQL/Supabase)
const memoryStore: Map<string, MemoryEntry[]> = new Map();

export function getSessionMemory(sessionId: string): MemoryEntry[] {
  return memoryStore.get(sessionId) || [];
}

export function addMemory(
  sessionId: string,
  content: string,
  category: MemoryCategory,
  confidence: number
): MemoryEntry {
  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    content,
    category,
    confidence,
    createdAt: Date.now(),
    sessionId,
  };

  const existing = memoryStore.get(sessionId) || [];
  existing.push(entry);
  memoryStore.set(sessionId, existing);

  return entry;
}

export function extractMemories(message: string, sessionId: string): MemoryEntry[] {
  const newMemories: MemoryEntry[] = [];
  const lower = message.toLowerCase();

  // Extract explicit facts
  if (lower.includes('my name is') || lower.includes('mi chiamo') || lower.includes('iam ')) {
    const nameMatch = message.match(/(?:my name is|mi chiamo|iam\s+)\s+(\w+)/i);
    if (nameMatch) {
      newMemories.push(addMemory(sessionId, `User's name is ${nameMatch[1]}`, 'EXPLICIT_FACT', 0.95));
    }
  }

  // Extract relationship patterns
  if (lower.includes('my partner') || lower.includes('my boyfriend') || lower.includes('my girlfriend') || lower.includes('mio partner') || lower.includes('mia moglie') || lower.includes('mio marito')) {
    newMemories.push(addMemory(sessionId, `User mentioned a romantic relationship`, 'EXPLICIT_FACT', 0.85));
  }

  // Extract emotional patterns
  if (lower.includes('i always') || lower.includes('i never') || lower.includes('sempre') || lower.includes('mai')) {
    newMemories.push(addMemory(sessionId, `User uses absolute language: "${message.slice(0, 100)}..."`, 'INFERRED_PATTERN', 0.60));
  }

  // Extract fears
  if (lower.includes('i am afraid') || lower.includes('i fear') || lower.includes('ho paura') || lower.includes('temo')) {
    newMemories.push(addMemory(sessionId, `User expressed fear: "${message.slice(0, 100)}..."`, 'EXPLICIT_FACT', 0.80));
  }

  return newMemories;
}

export function formatMemoryForPrompt(memories: MemoryEntry[]): string {
  if (memories.length === 0) return '';

  const sections: string[] = ['\n--- MEMORY CONTEXT ---'];

  const explicit = memories.filter(m => m.category === 'EXPLICIT_FACT');
  const inferred = memories.filter(m => m.category === 'INFERRED_PATTERN');
  const hypotheses = memories.filter(m => m.category === 'HYPOTHESIS');

  if (explicit.length > 0) {
    sections.push('EXPLICIT FACTS:');
    explicit.slice(-5).forEach(m => sections.push(`- ${m.content} (confidence: ${m.confidence})`));
  }

  if (inferred.length > 0) {
    sections.push('INFERRED PATTERNS:');
    inferred.slice(-3).forEach(m => sections.push(`- ${m.content} (confidence: ${m.confidence})`));
  }

  if (hypotheses.length > 0) {
    sections.push('HYPOTHESES:');
    hypotheses.slice(-3).forEach(m => sections.push(`- ${m.content} (confidence: ${m.confidence})`));
  }

  sections.push('--- END MEMORY ---\n');

  return sections.join('\n');
}
