import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '../components/FormField.tsx';
import FormError from '../components/FormError.tsx';
import { resetPasswordRequest } from '../services/authService.ts';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setServerError('');
      setMessage('');
      const res = await resetPasswordRequest({ token, password: data.password });
      setMessage(res.data.message);
    } catch (err: unknown) {
      const responseMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setServerError(responseMessage || 'Không thể đặt lại mật khẩu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Đặt lại mật khẩu</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormError message={serverError} />
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}.{' '}
              <Link to="/login" className="font-semibold hover:underline">
                Đăng nhập
              </Link>
            </div>
          )}
          <FormField
            id="password"
            label="Mật khẩu mới"
            type="password"
            error={errors.password}
            {...register('password')}
          />
          <FormField
            id="confirmPassword"
            label="Nhập lại mật khẩu"
            type="password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
