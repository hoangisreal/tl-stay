import { useState } from 'react';

interface CalendarManagerProps {
  blockedDates: string[];
  customPricing: { date: string; price: number }[];
  basePrice: number;
  onUpdate: (data: { blockedDates: string[]; customPricing: { date: string; price: number }[] }) => void;
}

export default function CalendarManager({ blockedDates, customPricing, basePrice, onUpdate }: CalendarManagerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [blocked, setBlocked] = useState<string[]>(blockedDates);
  const [pricing, setPricing] = useState<{ date: string; price: number }[]>(customPricing);

  const addBlockedDate = () => {
    if (selectedDate && !blocked.includes(selectedDate)) {
      const updated = [...blocked, selectedDate];
      setBlocked(updated);
      onUpdate({ blockedDates: updated, customPricing: pricing });
      setSelectedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    const updated = blocked.filter(d => d !== date);
    setBlocked(updated);
    onUpdate({ blockedDates: updated, customPricing: pricing });
  };

  const addCustomPrice = () => {
    if (selectedDate && customPrice) {
      const updated = [...pricing.filter(p => p.date !== selectedDate), { date: selectedDate, price: Number(customPrice) }];
      setPricing(updated);
      onUpdate({ blockedDates: blocked, customPricing: updated });
      setSelectedDate('');
      setCustomPrice('');
    }
  };

  const removeCustomPrice = (date: string) => {
    const updated = pricing.filter(p => p.date !== date);
    setPricing(updated);
    onUpdate({ blockedDates: blocked, customPricing: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Chặn ngày</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={addBlockedDate} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            Chặn
          </button>
        </div>
        <div className="space-y-1">
          {blocked.map(date => (
            <div key={date} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
              <span>{date}</span>
              <button onClick={() => removeBlockedDate(date)} className="text-rose-500 hover:underline">Xóa</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Giá tùy chỉnh (Giá gốc: {basePrice.toLocaleString()}đ)</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Giá"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={addCustomPrice} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            Thêm
          </button>
        </div>
        <div className="space-y-1">
          {pricing.map(p => (
            <div key={p.date} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
              <span>{p.date}: {p.price.toLocaleString()}đ</span>
              <button onClick={() => removeCustomPrice(p.date)} className="text-rose-500 hover:underline">Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
