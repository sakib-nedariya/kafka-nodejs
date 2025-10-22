const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { publishMessage } = require('../kafka/Producer');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: 'Amount and email are required' });
    }

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, name, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const [result] = await db.execute(
      `INSERT INTO payments (order_id, payment_id, signature, email, name, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, email, name, amount, 'SUCCESS']
    );

    const message = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      email,   
      name,
      amount,
      status: 'SUCCESS',
      dbId: result.insertId
    };

    await publishMessage(process.env.KAFKA_TOPIC, message);

    res.json({ success: true, message: 'Payment verified, saved & email triggered via Kafka' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
