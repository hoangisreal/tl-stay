import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import { fetchConversations, type Conversation } from '../services/conversationService.ts';
import { resolveFirstImage } from '../lib/images.ts';

const fmtTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError('');
      const { data } = await fetchConversations();
      setConversations(data);
    } catch {
      setError('Không thể tải hộp thư');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(() => loadConversations(true), 9000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tin nhắn</h1>
          <p className="text-sm text-gray-500">Trao đổi giữa khách và chủ nhà.</p>
        </div>
        <button
          onClick={() => loadConversations()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">💬</p>
          <p>Bạn chưa có hội thoại nào.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {conversations.map((conversation) => {
            const other = conversation.host._id === user?._id ? conversation.guest : conversation.host;
            const img = resolveFirstImage(conversation.listing.images);
            return (
              <Link
                key={conversation._id}
                to={`/messages/${conversation._id}`}
                className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <img src={img} alt={conversation.listing.title} className="h-20 w-24 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{other.name}</p>
                      <p className="text-sm text-gray-500 truncate">{conversation.listing.title}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {conversation.lastMessage?.body || 'Chưa có tin nhắn'}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">{fmtTime(conversation.lastMessageAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
