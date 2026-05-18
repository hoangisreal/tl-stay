import { AMENITIES_LIST } from '../lib/amenities.ts';

interface AmenityPickerProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
}

export default function AmenityPicker({ selected, onChange }: AmenityPickerProps) {
  const toggle = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES_LIST.map((amenity) => (
        <button
          key={amenity}
          type="button"
          onClick={() => toggle(amenity)}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
            selected.includes(amenity)
              ? 'bg-rose-500 text-white border-rose-500'
              : 'border-gray-300 text-gray-700 hover:border-rose-400'
          }`}
        >
          {amenity}
        </button>
      ))}
    </div>
  );
}
