import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/llm';
import { ChatRequest, ChatResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, sessionId: providedSessionId, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const sessionId = providedSessionId || crypto.randomUUID();

    const result = await generateResponse(message, sessionId, history);

    const response: ChatResponse = {
      message: result.content,
      sessionId,
      safety: result.safety,
      evidence: result.evidence,
      memory: result.memory,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
