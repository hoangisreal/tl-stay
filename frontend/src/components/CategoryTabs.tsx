import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../lib/categories.ts';

export default function CategoryTabs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const active = searchParams.get('category') || '';

  const select = (key: string) => {
    const params = new URLSearchParams(searchParams);
    if (active === key) params.delete('category');
    else params.set('category', key);
    params.set('page', '1');
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {CATEGORIES.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => select(c.key)}
            className={`flex flex-col items-center gap-1 min-w-[78px] px-3 py-2 border-b-2 transition-colors ${
              isActive
                ? 'border-gray-800 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-medium whitespace-nowrap">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
