const searchService = require("../services/searchService");
const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");

async function search(req, res, next) {
  try {
    const { q, region, checkIn, checkOut } = req.query;
    const results = await searchService.searchProperties({ q: q || region, checkIn, checkOut });
    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const property = await searchService.getPropertyById(req.params.id);
    if (!property) throw new AppError("Property not found", 404, "NOT_FOUND");
    res.json(property);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, region, county, latitude, longitude } = req.body;
    if ([name, region, county].some((v) => typeof v !== "string" || v.trim().length < 2)) {
      throw new AppError("Name, region and county are required", 400, "VALIDATION_ERROR");
    }
    const property = await prisma.property.create({
      data: {
        ownerId: req.user.id,
        name: name.trim(),
        region: region.trim(),
        county: county.trim(),
        latitude: Number.isFinite(latitude) ? latitude : undefined,
        longitude: Number.isFinite(longitude) ? longitude : undefined,
      },
    });
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) throw new AppError("Property not found", 404, "NOT_FOUND");
    if (property.ownerId !== req.user.id) {
      throw new AppError("Not authorized to edit this property", 403, "NOT_AUTHORIZED");
    }

    // Whitelist editable fields; never let the client change ownerId or id.
    const { name, region, county, latitude, longitude } = req.body;
    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: { name, region, county, latitude, longitude },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: {
        rooms: { orderBy: { pricePerNight: "asc" } },
        photos: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(properties);
  } catch (err) {
    next(err);
  }
}

module.exports = { search, getById, create, update, mine };
