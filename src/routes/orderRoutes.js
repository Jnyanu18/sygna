const express = require("express");
const db = require("../db/fakeDb");

const router = express.Router();

router.post("/", async (req, res) => {
  const { itemId, quantity } = req.body;

  // Intentional bug: missing validation for required fields and types.
  const created = await db.createOrder(itemId, quantity);

  res.status(201).json({
    message: "Order placed successfully.",
    order: created,
  });
});

module.exports = router;
