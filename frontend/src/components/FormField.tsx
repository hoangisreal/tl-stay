import { InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
}

export default function FormField({ label, error, id, ...props }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 transition ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
