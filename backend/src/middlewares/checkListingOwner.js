import Listing from '../models/Listing.js';

const checkListingOwner = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    return next(new Error('Listing not found'));
  }
  if (listing.host.toString() !== req.user._id.toString()) {
    res.status(403);
    return next(new Error('Forbidden'));
  }
  req.listing = listing;
  next();
};

export default checkListingOwner;
