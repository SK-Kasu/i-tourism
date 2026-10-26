const bookingService = require("../services/bookingService");

async function create(req, res, next) {
  try {
    const booking = await bookingService.createBooking({
      ...req.body,
      travelerId: req.user.id,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

async function myBookings(req, res, next) {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const booking = await bookingService.getById(req.params.id, req.user);
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancel(req.params.id, req.user.id);
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

async function ownerBookings(req, res, next) {
  try {
    res.json(await bookingService.getOwnerBookings(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, myBookings, ownerBookings, getById, cancel };
