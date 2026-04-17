const express = require("express");
const db = require("../db/fakeDb");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const menu = await db.getMenuItems();

    // Intentional bug: this will crash when an item is null/undefined.
    const normalizedMenu = menu.map((item) => ({
      id: item.id,
      name: item.name.toUpperCase(),
      price: item.price,
    }));

    res.json(normalizedMenu);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
