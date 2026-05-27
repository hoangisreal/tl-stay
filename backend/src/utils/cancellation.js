export const calculateRefund = (booking, listing, cancelDate = new Date()) => {
  const checkInDate = new Date(booking.checkIn);
  const daysUntilCheckIn = Math.ceil((checkInDate - cancelDate) / (1000 * 60 * 60 * 24));
  const policy = listing.cancellationPolicy || 'moderate';
  
  let refundPercentage = 0;
  
  if (policy === 'flexible') {
    if (daysUntilCheckIn >= 1) refundPercentage = 100;
  } else if (policy === 'moderate') {
    if (daysUntilCheckIn >= 5) refundPercentage = 100;
    else if (daysUntilCheckIn >= 1) refundPercentage = 50;
  } else if (policy === 'strict') {
    if (daysUntilCheckIn >= 7) refundPercentage = 100;
    else if (daysUntilCheckIn >= 3) refundPercentage = 50;
  }
  
  const refundAmount = Math.round((booking.totalPrice * refundPercentage) / 100);
  return { refundPercentage, refundAmount, policy };
};

export const canCancel = (booking) => {
  if (booking.status === 'cancelled') return false;
  const checkInDate = new Date(booking.checkIn);
  return checkInDate > new Date();
};
