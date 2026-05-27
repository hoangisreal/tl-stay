interface VerifiedBadgeProps {
  verified?: { email?: boolean; phone?: boolean; id?: boolean };
}

export default function VerifiedBadge({ verified }: VerifiedBadgeProps) {
  if (!verified?.email && !verified?.phone && !verified?.id) return null;
  
  const badges = [];
  if (verified.email) badges.push('Email');
  if (verified.phone) badges.push('Phone');
  if (verified.id) badges.push('ID');
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified {badges.join(', ')}
    </span>
  );
}
