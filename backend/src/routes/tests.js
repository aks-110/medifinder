import { Router } from "express";
import * as repo from "../db/repo.js";
import { cacheGet, cacheSet } from "../lib/redis.js";

const router = Router();

router.get("/", async (req, res) => {
  const { q, category } = req.query;
  const results = await repo.listTests({ q, category });
  res.json({ results });
});

router.get("/:slug", async (req, res) => {
  const test = await repo.findTestBySlug(req.params.slug);
  if (!test) return res.status(404).json({ error: "Test not found" });

  const { sort = "price", homeCollection, insuranceAccepted, openNow, maxDistance, lat, lng } = req.query;
  const userLat = lat ? Number(lat) : null;
  const userLng = lng ? Number(lng) : null;

  const cacheKey = `offers:${test.id}:${sort}:${homeCollection}:${insuranceAccepted}:${openNow}:${maxDistance}:${lat}:${lng}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  let offers = (await repo.listOffersForTest(test.id)).map((offer) => ({
    ...offer,
    distanceKm: distanceFor(offer.provider, userLat, userLng),
  }));

  if (homeCollection === "true") offers = offers.filter((o) => o.provider.homeCollection);
  if (insuranceAccepted === "true") offers = offers.filter((o) => o.provider.insuranceAccepted);
  if (openNow === "true") offers = offers.filter((o) => o.provider.openNow);
  if (maxDistance) offers = offers.filter((o) => o.distanceKm <= Number(maxDistance));

  const sorters = {
    price: (a, b) => a.price - b.price,
    distance: (a, b) => a.distanceKm - b.distanceKm,
    rating: (a, b) => b.provider.rating - a.provider.rating,
  };
  offers.sort(sorters[sort] || sorters.price);

  const cheapest = offers.reduce((min, o) => (!min || o.price < min.price ? o : min), null);
  const bestRated = offers.reduce((max, o) => (!max || o.provider.rating > max.provider.rating ? o : max), null);
  const fastest = offers.reduce((min, o) => (!min || o.reportTimeHours < min.reportTimeHours ? o : min), null);

  const payload = {
    test,
    offers,
    usingRealLocation: userLat !== null && userLng !== null,
    highlights: {
      cheapestProviderId: cheapest?.provider.id,
      bestRatedProviderId: bestRated?.provider.id,
      fastestProviderId: fastest?.provider.id,
    },
  };

  await cacheSet(cacheKey, payload, 30);
  res.json(payload);
});

router.get("/:slug/slots", async (req, res) => {
  const test = await repo.findTestBySlug(req.params.slug);
  const { providerId } = req.query;
  if (!test || !providerId) return res.status(400).json({ error: "test and providerId are required" });
  const slots = await repo.getSlots(providerId, test.id);
  res.json({ slots: slots.map((s) => ({ id: s.id, date: s.date, time: s.time, available: s.available })) });
});

function distanceFor(provider, userLat, userLng) {
  if (userLat !== null && userLng !== null) {
    return haversineKm(userLat, userLng, provider.lat, provider.lng);
  }
  const seed = provider.id.charCodeAt(1);
  return Math.round(((seed % 9) + 0.5 + (seed % 3) * 0.3) * 10) / 10;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default router;
