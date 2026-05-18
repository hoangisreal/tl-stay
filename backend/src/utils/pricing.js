export const calculateTotalPrice = (checkIn, checkOut, pricePerNight) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
  return nights * pricePerNight;
};
