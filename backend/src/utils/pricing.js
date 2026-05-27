const SERVICE_FEE_RATE = 0.1;
const TAX_RATE = 0.08;

export const countNights = (checkIn, checkOut) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.round((endUtc - startUtc) / msPerDay);
};

const calculateDynamicPrice = (listing, date) => {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const customPrice = listing.customPricing?.find(
    p => new Date(p.date).toDateString() === dateObj.toDateString()
  );
  if (customPrice) return customPrice.price;

  const basePrice = listing.pricePerNight;
  return isWeekend ? basePrice * (listing.weekendPriceMultiplier || 1) : basePrice;
};

export const computeBreakdown = (checkIn, checkOut, pricePerNight, cleaningFee = 0, listing = null) => {
  const nights = countNights(checkIn, checkOut);
  let subtotal;

  if (listing && (listing.customPricing?.length > 0 || listing.weekendPriceMultiplier !== 1)) {
    subtotal = 0;
    const checkInDate = new Date(checkIn);
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      subtotal += calculateDynamicPrice(listing, currentDate);
    }
  } else {
    subtotal = nights * pricePerNight;
  }

  let specialOfferDiscount = 0;
  if (listing?.specialOffers?.length > 0) {
    const checkInDate = new Date(checkIn);
    const activeOffer = listing.specialOffers.find(offer => {
      const validFrom = new Date(offer.validFrom);
      const validTo = new Date(offer.validTo);
      return checkInDate >= validFrom && checkInDate <= validTo && nights >= (offer.minNights || 1);
    });
    if (activeOffer) {
      specialOfferDiscount = Math.round((subtotal * activeOffer.discountPercentage) / 100);
    }
  }

  const monthlyDiscount = nights >= 28 && listing?.monthlyDiscount ? Math.round((subtotal * listing.monthlyDiscount) / 100) : 0;
  const totalDiscount = specialOfferDiscount + monthlyDiscount;
  const serviceFee = Math.round((subtotal - totalDiscount) * SERVICE_FEE_RATE);
  const tax = Math.round((subtotal - totalDiscount + cleaningFee + serviceFee) * TAX_RATE);
  const totalPrice = subtotal - totalDiscount + cleaningFee + serviceFee + tax;
  return { nights, subtotal, specialOfferDiscount, monthlyDiscount, cleaningFee, serviceFee, tax, totalPrice };
};

export const calculateTotalPrice = (checkIn, checkOut, pricePerNight) =>
  countNights(checkIn, checkOut) * pricePerNight;
