import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '../components/FormField.tsx';
import FormError from '../components/FormError.tsx';
import { changePasswordRequest } from '../services/authService.ts';
import { getApiError } from '../lib/getApiError.ts';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setServerError('');
      setMessage('');
      const res = await changePasswordRequest({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage(res.data.message);
      reset();
    } catch (err: unknown) {
      setServerError(getApiError(err, 'Không thể đổi mật khẩu'));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormError message={serverError} />
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          <FormField
            id="currentPassword"
            label="Mật khẩu hiện tại"
            type="password"
            error={errors.currentPassword}
            {...register('currentPassword')}
          />
          <FormField
            id="newPassword"
            label="Mật khẩu mới"
            type="password"
            error={errors.newPassword}
            {...register('newPassword')}
          />
          <FormField
            id="confirmPassword"
            label="Nhập lại mật khẩu mới"
            type="password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </form>
        <Link to="/" className="mt-4 inline-block text-sm text-rose-500 font-medium hover:underline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
