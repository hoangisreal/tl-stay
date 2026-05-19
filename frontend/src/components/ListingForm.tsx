import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Listing } from '../services/listingService.ts';
import FormField from './FormField.tsx';
import FormError from './FormError.tsx';
import AmenityPicker from './AmenityPicker.tsx';
import ImageUploader from './ImageUploader.tsx';
import { resolveImageUrl } from '../lib/images.ts';
import { CATEGORIES } from '../lib/categories.ts';
import { getApiError } from '../lib/getApiError.ts';

const optionalNumber = z.preprocess(
  (value) => (typeof value === 'number' && Number.isNaN(value) ? undefined : value),
  z.number().int().min(1).optional()
);

const optionalDecimal = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'number' && Number.isNaN(value) ? undefined : value),
    z.number().min(min).max(max).optional()
  );

const listingSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  pricePerNight: z.number().positive('Giá phải lớn hơn 0'),
  cleaningFee: z.preprocess(
    (value) => (typeof value === 'number' && Number.isNaN(value) ? undefined : value),
    z.number().min(0).optional()
  ),
  minNights: z.number().int().min(1).optional(),
  maxNights: z.number().int().min(1).optional(),
  advanceNoticeDays: z.number().int().min(0).optional(),
  maxAdvanceBookingDays: z.number().int().min(1).optional(),
  maxGuests: z.number().int().min(1, 'Ít nhất 1 khách'),
  bedrooms: optionalNumber,
  beds: optionalNumber,
  bathrooms: optionalNumber,
  city: z.string().min(2, 'Vui lòng nhập thành phố'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ'),
  country: z.string().optional(),
  lat: optionalDecimal(-90, 90),
  lng: optionalDecimal(-180, 180),
  category: z.string().optional(),
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
  const [blockedDatesText, setBlockedDatesText] = useState(
    (listing?.blockedDates || []).map((date) => new Date(date).toISOString().slice(0, 10)).join(', ')
  );

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
          cleaningFee: listing.cleaningFee,
          minNights: listing.minNights || 1,
          maxNights: listing.maxNights || undefined,
          advanceNoticeDays: listing.advanceNoticeDays || 0,
          maxAdvanceBookingDays: listing.maxAdvanceBookingDays || 365,
          maxGuests: listing.maxGuests,
          bedrooms: listing.bedrooms,
          beds: listing.beds,
          bathrooms: listing.bathrooms,
          city: listing.location.city,
          address: listing.location.address,
          country: listing.location.country,
          lat: listing.location.lat,
          lng: listing.location.lng,
          category: listing.category,
        }
      : { category: 'city', country: 'Việt Nam', minNights: 1, advanceNoticeDays: 0, maxAdvanceBookingDays: 365 },
  });

  const handleFormSubmit = async (data: ListingFormData) => {
    try {
      setServerError('');
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined) formData.append(key, String(val));
      });
      formData.append('amenities', JSON.stringify(amenities));
      const blockedDates = blockedDatesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      formData.append('blockedDates', JSON.stringify(blockedDates));
      if (imageFiles) {
        Array.from(imageFiles).forEach((file) => formData.append('images', file));
      }
      await onSubmit(formData);
    } catch (err: unknown) {
      setServerError(getApiError(err, 'Có lỗi xảy ra'));
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="pricePerNight" label="Giá / đêm (VNĐ)" type="number" error={errors.pricePerNight} {...register('pricePerNight', { valueAsNumber: true })} />
        <FormField id="cleaningFee" label="Phí dọn dẹp (VNĐ)" type="number" error={errors.cleaningFee} {...register('cleaningFee', { valueAsNumber: true })} />
        <FormField id="maxGuests" label="Số khách tối đa" type="number" error={errors.maxGuests} {...register('maxGuests', { valueAsNumber: true })} />
        <FormField id="minNights" label="Số đêm tối thiểu" type="number" error={errors.minNights} {...register('minNights', { valueAsNumber: true })} />
        <FormField id="maxNights" label="Số đêm tối đa" type="number" error={errors.maxNights} {...register('maxNights', { valueAsNumber: true })} />
        <FormField id="advanceNoticeDays" label="Báo trước (ngày)" type="number" error={errors.advanceNoticeDays} {...register('advanceNoticeDays', { valueAsNumber: true })} />
        <FormField id="maxAdvanceBookingDays" label="Mở lịch tối đa (ngày)" type="number" error={errors.maxAdvanceBookingDays} {...register('maxAdvanceBookingDays', { valueAsNumber: true })} />
        <FormField id="bedrooms" label="Phòng ngủ" type="number" error={errors.bedrooms} {...register('bedrooms', { valueAsNumber: true })} />
        <FormField id="beds" label="Giường" type="number" error={errors.beds} {...register('beds', { valueAsNumber: true })} />
        <FormField id="bathrooms" label="Phòng tắm" type="number" error={errors.bathrooms} {...register('bathrooms', { valueAsNumber: true })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="city" label="Thành phố" error={errors.city} {...register('city')} />
        <FormField id="country" label="Quốc gia" error={errors.country} {...register('country')} />
      </div>
      <FormField id="address" label="Địa chỉ" error={errors.address} {...register('address')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FormField id="lat" label="Vĩ độ" type="number" step="0.000001" error={errors.lat} {...register('lat', { valueAsNumber: true })} />
          <p className="mt-1 text-xs text-gray-500">Ví dụ: 16.0678. Bỏ trống nếu chưa có tọa độ.</p>
        </div>
        <div>
          <FormField id="lng" label="Kinh độ" type="number" step="0.000001" error={errors.lng} {...register('lng', { valueAsNumber: true })} />
          <p className="mt-1 text-xs text-gray-500">Ví dụ: 108.2208. Dùng để hiển thị bản đồ.</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">Loại phòng</label>
        <select
          id="category"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
          {...register('category')}
        >
          {CATEGORIES.map((category) => (
            <option key={category.key} value={category.key}>{category.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Tiện ích</span>
        <AmenityPicker selected={amenities} onChange={setAmenities} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="blockedDates" className="text-sm font-medium text-gray-700">Ngày khoá lịch</label>
        <textarea
          id="blockedDates"
          rows={2}
          value={blockedDatesText}
          onChange={(e) => setBlockedDatesText(e.target.value)}
          placeholder="2026-06-01, 2026-06-02"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 resize-none"
        />
        <p className="text-xs text-gray-500">Nhập các ngày không nhận khách, cách nhau bằng dấu phẩy.</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Ảnh phòng</span>
        <ImageUploader
          onChange={setImageFiles}
          existingImages={listing?.images.map(resolveImageUrl)}
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
