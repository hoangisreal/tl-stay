import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import {
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type Conversation,
  type Message,
} from '../services/conversationService.ts';

const fmtTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function ConversationPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const other = useMemo(() => {
    if (!conversation || !user) return null;
    return conversation.host._id === user._id ? conversation.guest : conversation.host;
  }, [conversation, user]);

  const loadConversation = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      setError('');
      const [conversationsRes, messagesRes] = await Promise.all([
        fetchConversations(),
        fetchConversationMessages(id),
      ]);
      setConversation(conversationsRes.data.find((item) => item._id === id) || null);
      setMessages(messagesRes.data);
      await markConversationRead(id);
    } catch {
      setError('Không thể tải hội thoại');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    const timer = window.setInterval(() => loadConversation(true), 9000);
    return () => window.clearInterval(timer);
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !id) return;
    try {
      setSending(true);
      setError('');
      const { data } = await sendConversationMessage(id, trimmed);
      setMessages((prev) => [...prev, data]);
      setBody('');
    } catch {
      setError('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/messages" className="text-sm font-medium text-rose-500 hover:underline">
            ← Tin nhắn
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-800">{other?.name || 'Hội thoại'}</h1>
          {conversation && (
            <Link to={`/listings/${conversation.listing._id}`} className="text-sm text-gray-500 hover:text-rose-500">
              {conversation.listing.title}
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex h-[62vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => {
            const mine = message.sender._id === user?._id;
            return (
              <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${mine ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="whitespace-pre-line text-sm">{message.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? 'text-rose-100' : 'text-gray-400'}`}>{fmtTime(message.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 p-3">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Nhập tin nhắn..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            disabled={sending || !body.trim()}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
