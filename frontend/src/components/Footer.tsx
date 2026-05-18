export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} TL-Stay. Đồ án học phần.
        </p>
      </div>
    </footer>
  );
}
