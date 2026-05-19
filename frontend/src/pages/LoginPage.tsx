import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import FormField from '../components/FormField.tsx';
import FormError from '../components/FormError.tsx';
import { getApiError } from '../lib/getApiError.ts';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError('');
      await login(data.email, data.password);
      const redirect = searchParams.get('redirect');
      navigate(redirect && redirect.startsWith('/') ? redirect : '/');
    } catch (err: unknown) {
      setServerError(getApiError(err, 'Đăng nhập thất bại'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Đăng nhập</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormError message={serverError} />
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email}
            {...register('email')}
          />
          <FormField
            id="password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password')}
          />
          <div className="-mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-rose-500 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-rose-500 font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
