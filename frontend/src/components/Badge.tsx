interface BadgeProps {
  status: 'pending' | 'confirmed' | 'cancelled';
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
