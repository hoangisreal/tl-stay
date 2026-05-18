import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Listing } from '../services/listingService.ts';
import FormField from './FormField.tsx';
import FormError from './FormError.tsx';
import AmenityPicker from './AmenityPicker.tsx';
import ImageUploader from './ImageUploader.tsx';

const listingSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  pricePerNight: z.number().positive('Giá phải lớn hơn 0'),
  maxGuests: z.number().int().min(1, 'Ít nhất 1 khách'),
  bedrooms: z.number().int().min(1).optional(),
  beds: z.number().int().min(1).optional(),
  bathrooms: z.number().int().min(1).optional(),
  city: z.string().min(2, 'Vui lòng nhập thành phố'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ'),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormProps {
  listing?: Listing;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function ListingForm({ listing, onSubmit, onCancel }: ListingFormProps) {
  const [serverError, setServerError] = useState('');
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities || []);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: listing
      ? {
          title: listing.title,
          description: listing.description,
          pricePerNight: listing.pricePerNight,
          maxGuests: listing.maxGuests,
          bedrooms: listing.bedrooms,
          beds: listing.beds,
          bathrooms: listing.bathrooms,
          city: listing.location.city,
          address: listing.location.address,
        }
      : {},
  });

  const handleFormSubmit = async (data: ListingFormData) => {
    try {
      setServerError('');
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined) formData.append(key, String(val));
      });
      formData.append('amenities', JSON.stringify(amenities));
      if (imageFiles) {
        Array.from(imageFiles).forEach((file) => formData.append('images', file));
      }
      await onSubmit(formData);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setServerError(message || 'Có lỗi xảy ra');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      <FormError message={serverError} />
      <FormField id="title" label="Tiêu đề" error={errors.title} {...register('title')} />
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          id="description"
          rows={4}
          className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="pricePerNight" label="Giá / đêm (VNĐ)" type="number" error={errors.pricePerNight} {...register('pricePerNight', { valueAsNumber: true })} />
        <FormField id="maxGuests" label="Số khách tối đa" type="number" error={errors.maxGuests} {...register('maxGuests', { valueAsNumber: true })} />
        <FormField id="bedrooms" label="Phòng ngủ" type="number" error={errors.bedrooms} {...register('bedrooms', { valueAsNumber: true })} />
        <FormField id="beds" label="Giường" type="number" error={errors.beds} {...register('beds', { valueAsNumber: true })} />
        <FormField id="bathrooms" label="Phòng tắm" type="number" error={errors.bathrooms} {...register('bathrooms', { valueAsNumber: true })} />
      </div>
      <FormField id="city" label="Thành phố" error={errors.city} {...register('city')} />
      <FormField id="address" label="Địa chỉ" error={errors.address} {...register('address')} />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Tiện ích</span>
        <AmenityPicker selected={amenities} onChange={setAmenities} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Ảnh phòng</span>
        <ImageUploader
          onChange={setImageFiles}
          existingImages={listing?.images.map((img) =>
            `${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`
          )}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Đang lưu...' : listing ? 'Cập nhật' : 'Tạo phòng'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}
