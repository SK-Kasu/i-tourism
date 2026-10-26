const roomService = require("../services/roomService");

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const addRoom = wrap(async (req, res) => {
  res.status(201).json(await roomService.addRoom(req.params.propertyId, req.user.id, req.body));
});

const updateRoom = wrap(async (req, res) => {
  res.json(await roomService.updateRoom(req.params.id, req.user.id, req.body));
});

const setAvailability = wrap(async (req, res) => {
  res.json(await roomService.setBlocked(req.params.id, req.user.id, req.body));
});

const getAvailability = wrap(async (req, res) => {
  res.json(await roomService.getAvailability(req.params.id, req.query.month || currentMonth()));
});

const getCalendar = wrap(async (req, res) => {
  res.json(await roomService.getCalendar(req.params.id, req.user.id, req.query.month || currentMonth()));
});

const getRoom = wrap(async (req, res) => {
  res.json(await roomService.getRoom(req.params.id));
});

module.exports = { addRoom, updateRoom, setAvailability, getAvailability, getCalendar, getRoom };
