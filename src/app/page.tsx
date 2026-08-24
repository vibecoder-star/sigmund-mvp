'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, EvidenceSource } from '@/types';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSource[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize session
    setSessionId(crypto.randomUUID());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          history: messages,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        safety: data.safety,
        evidence: data.evidence,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Mi scuso, c\'è stato un problema tecnico. Per favore riprova.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 fade-in-up">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-bone tracking-wider mb-4">
          SIGMUND
        </h1>
        <p className="text-ivory/60 text-sm md:text-base tracking-widest uppercase mb-2">
          Dimmi ciò che normalmente non diresti a nessuno.
        </p>
        <div className="w-16 h-px bg-rust/50 mx-auto mt-4"></div>
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-2xl bg-obsidian/80 border border-ash/30 rounded-sm overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-ivory/40 text-sm mt-16">
              <p className="font-serif italic text-lg mb-2">Benvenuto nel mio studio.</p>
              <p>Sedetevi. Di cosa desiderate parlare?</p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-sm text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ash/50 text-bone'
                    : 'bg-charcoal/50 text-ivory/90 border-l-2 border-rust/30'
                }`}
              >
                {msg.role === 'assistant' && (
                  <span className="block text-xs text-rust/70 font-serif italic mb-1">
                    ✦ Sigmund
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.evidence && msg.evidence.length > 0 && (
                  <button
                    onClick={() => setSelectedEvidence(msg.evidence!)}
                    className="mt-2 text-xs text-rust/60 hover:text-rust/90 underline underline-offset-2"
                  >
                    Evidence ({msg.evidence.length})
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-charcoal/50 border-l-2 border-rust/30 px-4 py-3 rounded-sm">
                <span className="text-xs text-rust/70 font-serif italic">✦ Sigmund</span>
                <p className="text-ivory/50 text-sm mt-1 typing-cursor">sta riflettendo</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-ash/30 flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Scrivi qui..."
            className="flex-1 bg-transparent text-bone px-4 py-3 text-sm outline-none placeholder:text-ivory/30"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="px-6 py-3 text-sm text-rust/70 hover:text-rust hover:bg-ash/20 transition-colors disabled:opacity-30"
          >
            Invia
          </button>
        </form>
      </div>

      {/* Evidence Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-obsidian border border-ash/30 rounded-sm max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-bone text-lg">Evidence</h3>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-ivory/50 hover:text-bone"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedEvidence.map(source => (
                <div key={source.id} className="border-b border-ash/20 pb-3">
                  <p className="text-bone text-sm font-medium">{source.title}</p>
                  <p className="text-ivory/60 text-xs mt-1">
                    {source.authors.join(', ')} ({source.year}) — {source.journal}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-ash/30 rounded text-ivory/70">
                      {source.studyType.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-rust/20 rounded text-rust/80">
                      {source.evidenceLevel}
                    </span>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-rust/70 hover:text-rust underline mt-1 inline-block"
                    >
                      View source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-ivory/30 text-xs max-w-md">
        <p className="mb-2">
          ⚠ Avviso Legale — SIGMUND è un personaggio fittizio generato da intelligenza artificiale a scopo esclusivamente ludico e di intrattenimento.
        </p>
        <p>
          Non fornisce consulenza psicologica, psicoterapeutica o psichiatrica. In caso di disagio, rivolgiti a un professionista della salute mentale.
        </p>
      </footer>
    </main>
  );
}
