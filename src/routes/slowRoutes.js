const express = require("express");
const db = require("../db/fakeDb");

const router = express.Router();

router.get("/", async (req, res) => {
  const orders = await db.getOrders();
  const output = [];

  // Intentional inefficiency (N+1 query pattern):
  // one query for orders, then one query per order for item data.
  for (const order of orders) {
    const item = await db.getItemById(order.itemId);

    output.push({
      orderId: order.id,
      itemId: order.itemId,
      itemName: item ? item.name : "UNKNOWN ITEM",
      quantity: order.quantity,
    });
  }

  res.json({
    message: "This endpoint is intentionally slow.",
    totalOrders: output.length,
    orders: output,
  });
});

module.exports = router;
