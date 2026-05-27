import { getOverviewStats, getRevenueByMonth, getTopListings, getBookingsByStatus, getHostStats } from '../utils/analytics.js';

export const getOverview = async (req, res, next) => {
  try {
    const stats = await getOverviewStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getRevenue = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await getRevenueByMonth(months);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getTop = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const listings = await getTopListings(limit);
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const data = await getBookingsByStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getHostAnalytics = async (req, res, next) => {
  try {
    const stats = await getHostStats(req.user._id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
