const express = require("express");
const db = require("../db/fakeDb");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const menu = await db.getMenuItems();

    const normalizedMenu = menu.map((item) => {
      if (item) {
        return {
          id: item.id,
          name: item.name.toUpperCase(),
          price: item.price,
        };
      } else {
        return null;
      }
    });

    res.json(normalizedMenu);
  } catch (err) {
    next(err);
  }
});

module.exports = router;