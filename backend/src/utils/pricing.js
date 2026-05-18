const SERVICE_FEE_RATE = 0.1;
const TAX_RATE = 0.08;

export const countNights = (checkIn, checkOut) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
};

export const computeBreakdown = (checkIn, checkOut, pricePerNight, cleaningFee = 0) => {
  const nights = countNights(checkIn, checkOut);
  const subtotal = nights * pricePerNight;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const tax = Math.round((subtotal + cleaningFee + serviceFee) * TAX_RATE);
  const totalPrice = subtotal + cleaningFee + serviceFee + tax;
  return { nights, subtotal, cleaningFee, serviceFee, tax, totalPrice };
};

export const calculateTotalPrice = (checkIn, checkOut, pricePerNight) =>
  countNights(checkIn, checkOut) * pricePerNight;
