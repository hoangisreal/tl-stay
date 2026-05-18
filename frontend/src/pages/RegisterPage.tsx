import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import FormField from '../components/FormField.tsx';
import FormError from '../components/FormError.tsx';

const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum(['guest', 'host']),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'guest' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError('');
      await registerUser(data);
      navigate('/');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setServerError(message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormError message={serverError} />
          <FormField
            id="name"
            label="Họ tên"
            type="text"
            placeholder="Nguyễn Văn A"
            error={errors.name}
            {...register('name')}
          />
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
            placeholder="Ít nhất 6 ký tự"
            error={errors.password}
            {...register('password')}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Tôi muốn</span>
            <div className="grid grid-cols-2 gap-3">
              {(['guest', 'host'] as const).map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer hover:border-rose-400 transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50"
                >
                  <input type="radio" value={r} {...register('role')} className="accent-rose-500" />
                  <span className="text-sm font-medium">
                    {r === 'guest' ? '🏠 Đặt phòng' : '🔑 Cho thuê'}
                  </span>
                </label>
              ))}
            </div>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-rose-500 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
