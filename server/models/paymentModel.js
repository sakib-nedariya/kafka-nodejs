const db = require("../config/db")

async function savePayment({ orderId, paymentId, name, phone, amount, status }) {
  await db.query(
    'INSERT INTO payments (order_id, payment_id, name, phone, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
    [orderId, paymentId, name, phone, amount, status]
  );
}

module.exports = { savePayment };
