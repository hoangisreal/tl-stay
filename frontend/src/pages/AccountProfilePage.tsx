import { FormEvent, useEffect, useState } from 'react';
import FormError from '../components/FormError.tsx';
import useAuth from '../hooks/useAuth.ts';
import { getApiError } from '../lib/getApiError.ts';
import { updateProfileRequest, updateVerificationRequest, type AuthUser } from '../services/authService.ts';

const roleLabels: Record<AuthUser['role'], string> = {
  guest: 'Khách',
  host: 'Chủ nhà',
  admin: 'Admin',
  customer_support: 'Hỗ trợ khách hàng',
  content_moderator: 'Kiểm duyệt nội dung',
  finance_manager: 'Quản lý tài chính',
  operations_manager: 'Quản lý vận hành',
};

const verificationLabels: Record<keyof AuthUser['verified'], string> = {
  email: 'Email',
  phone: 'Điện thoại',
  id: 'ID',
};

export default function AccountProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [language, setLanguage] = useState<AuthUser['preferences']['language']>('vi');
  const [currency, setCurrency] = useState<AuthUser['preferences']['currency']>('VND');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || '');
    setLanguage(user.preferences?.language || 'vi');
    setCurrency(user.preferences?.currency || 'VND');
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await updateProfileRequest({
        name,
        phone,
        avatarUrl,
        preferences: { language, currency },
      });
      setUser(data);
      setMessage('Hồ sơ đã được cập nhật');
    } catch (err: unknown) {
      setError(getApiError(err, 'Không thể cập nhật hồ sơ'));
    } finally {
      setSaving(false);
    }
  };

  const verify = async (key: keyof AuthUser['verified']) => {
    setVerifying(key);
    setError('');
    setMessage('');
    try {
      const { data } = await updateVerificationRequest({ [key]: true });
      setUser(data);
      setMessage('Trạng thái xác thực đã được cập nhật');
    } catch (err: unknown) {
      setError(getApiError(err, 'Không thể xác thực'));
    } finally {
      setVerifying('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email} · {roleLabels[user.role]}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 space-y-4">
        <FormError message={error} />
        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Họ tên
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
              required
              minLength={2}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Số điện thoại
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Avatar URL
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="https://..."
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Ngôn ngữ
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as AuthUser['preferences']['language'])}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Tiền tệ
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as AuthUser['preferences']['currency'])}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Xác thực</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(verificationLabels) as (keyof AuthUser['verified'])[]).map((key) => {
            const verified = Boolean(user.verified?.[key]);
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{verificationLabels[key]}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {verified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </span>
                </div>
                {!verified && (
                  <button
                    type="button"
                    onClick={() => verify(key)}
                    disabled={verifying === key}
                    className="mt-4 w-full border border-blue-200 text-blue-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-60"
                  >
                    {verifying === key ? 'Đang xác thực...' : 'Xác thực demo'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
