const menuItems = [
  { id: 1, name: "Margherita Pizza", price: 10.5 },
  { id: 2, name: "Veg Burger", price: 7.25 },
  null,
  { id: 4, name: "Caesar Salad", price: 6.75 },
  { id: 5, name: "Pasta Alfredo", price: 11.0 },
];

const orders = [
  { id: 101, itemId: 1, quantity: 2 },
  { id: 102, itemId: 2, quantity: 1 },
  { id: 103, itemId: 4, quantity: 3 },
  { id: 104, itemId: 5, quantity: 1 },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMenuItems() {
  await wait(50);
  return menuItems;
}

async function getItemById(itemId) {
  await wait(120);
  return menuItems.find((item) => item && item.id === itemId);
}

async function getOrders() {
  await wait(80);
  return orders;
}

async function createOrder(itemId, quantity) {
  await wait(40);
  const newOrder = {
    id: orders.length + 200,
    itemId,
    quantity,
  };
  orders.push(newOrder);
  return newOrder;
}

module.exports = {
  getMenuItems,
  getItemById,
  getOrders,
  createOrder,
};
