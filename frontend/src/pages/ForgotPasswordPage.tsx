import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '../components/FormField.tsx';
import FormError from '../components/FormError.tsx';
import { forgotPasswordRequest } from '../services/authService.ts';
import { getApiError } from '../lib/getApiError.ts';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setServerError('');
      setMessage('');
      setResetLink('');
      const res = await forgotPasswordRequest(data);
      setMessage(res.data.message);
      setResetLink(res.data.resetLink || '');
    } catch (err: unknown) {
      setServerError(getApiError(err, 'Không thể tạo link đặt lại mật khẩu'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500 mb-6">Nhập email tài khoản để tạo link đặt lại mật khẩu.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormError message={serverError} />
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          {resetLink && (
            <Link
              to={new URL(resetLink).pathname}
              className="break-all rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-100"
            >
              Mở link demo: {resetLink}
            </Link>
          )}
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email}
            {...register('email')}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Đang tạo link...' : 'Tạo link đặt lại'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          <Link to="/login" className="text-rose-500 font-medium hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
