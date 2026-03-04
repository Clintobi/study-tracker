import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Bot, User, Loader } from 'lucide-react';
import { studyAPI, topicsAPI } from '../api/client';

export default function DiscussionPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      topicsAPI.getOne(id),
      studyAPI.getHistory(id),
    ]).then(([t, h]) => {
      setTopic(t);
      setMessages(h);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: msg }]);
    setSending(true);
    try {
      const { reply } = await studyAPI.sendMessage(id, msg);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear this conversation?')) return;
    await studyAPI.clearHistory(id);
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Link to={`/topics/${id}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Discuss: {topic?.name}</h1>
            <p className="text-xs text-gray-400">AI tutor powered by Claude</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-gray-400 hover:text-red-500 p-1" title="Clear conversation">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bot className="mx-auto mb-3" size={36} />
            <p className="font-medium">Start a conversation</p>
            <p className="text-sm mt-1">Ask me anything about <strong>{topic?.name}</strong></p>
            <div className="mt-5 space-y-2">
              {[
                'Can you explain the key concepts?',
                'Quiz me on what I should know',
                'What are the most important things to remember?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-sm text-blue-600 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-green-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-blue-600" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-green-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader size={16} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-40 flex items-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
