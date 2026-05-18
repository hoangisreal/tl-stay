export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl overflow-hidden">
          <div className="bg-gray-200 h-52 w-full" />
          <div className="p-3 space-y-2">
            <div className="bg-gray-200 h-4 rounded w-3/4" />
            <div className="bg-gray-200 h-3 rounded w-1/2" />
            <div className="bg-gray-200 h-4 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
