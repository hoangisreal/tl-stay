import { useEffect } from 'react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}

export default function ImageLightbox({ images, index, onClose, onChange }: ImageLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, images.length, onChange, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl"
        aria-label="Đóng"
      >
        ✕
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index - 1 + images.length) % images.length);
        }}
        className="absolute left-5 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl"
        aria-label="Trước"
      >
        ‹
      </button>
      <img
        src={images[index]}
        alt=""
        className="max-h-[88vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((index + 1) % images.length);
        }}
        className="absolute right-5 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl"
        aria-label="Sau"
      >
        ›
      </button>
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-sm">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}
