import { useRef, useState } from 'react';

interface ImageUploaderProps {
  onChange: (files: FileList | null) => void;
  existingImages?: string[];
}

export default function ImageUploader({ onChange, existingImages = [] }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    onChange(files);
    if (files) {
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      setPreviews(urls);
    }
  };

  const displayImages = previews.length ? previews : existingImages;

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-rose-400 transition"
      >
        <p className="text-sm text-gray-500">Nhấn để chọn ảnh (tối đa 10 ảnh, 5MB/ảnh)</p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {displayImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {displayImages.map((src, i) => (
            <img key={i} src={src} alt="" className="h-24 w-full object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
