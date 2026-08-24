# SIGMUND — Digital Psychological Reflection Companion

> *Dimmi ciò che normalmente non diresti a nessuno.*

SIGMUND is a digital psychological reflection companion inspired by psychoanalytic thought and informed by contemporary psychological research. It is **not** a medical device, diagnostic tool, or substitute for professional care.

## Stack

- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (serverless)
- **LLM:** OpenAI / Anthropic / any OpenAI-compatible provider (via env vars)
- **Scientific retrieval:** PubMed E-utilities, Europe PMC REST API
- **Memory:** In-memory store (designed for PostgreSQL/Supabase migration)
- **Safety:** Keyword-based classification layer

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
# Required for LLM (OpenAI or compatible)
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1  # Optional: for proxies
LLM_MODEL=gpt-4o-mini                        # Optional: model selection
```

## Architecture

```
User message → Safety classification
                    ↓
              [HIGH RISK] → Crisis response (immediate)
                    ↓
              [NORMAL/OTHER] → Memory extraction → Evidence retrieval (if needed)
                                                    ↓
                                              LLM response
```

## Safety Classifications

- NORMAL, DISTRESS, SELF_HARM, SUICIDAL_IDEATION, VIOLENCE, PSYCHOSIS, MEDICAL_EMERGENCY, MEDICATION_QUESTION, DIAGNOSIS_REQUEST

## Scientific Evidence Engine

- PubMed E-utilities (real-time search)
- Europe PMC REST API
- Automatic study type classification
- Evidence level grading (strong/moderate/limited/inconclusive)

## Evaluation Suite

```bash
npm test
```

Runs 60 psychological conversation scenarios testing safety boundaries, diagnosis avoidance, and evidence retrieval.

## Deployment

Deployable to Vercel, Netlify, or any Node.js host:

```bash
npm run build
npm start
```

## Legal Disclaimer

SIGMUND is a fictional AI-generated character for entertainment purposes only. It does not provide psychological, psychotherapeutic, or psychiatric consultation. The generated responses do not constitute diagnosis, treatment, or clinical support. In case of psychological distress, emotional difficulty, or crisis, contact a licensed mental health professional or emergency services.

## License

MIT
