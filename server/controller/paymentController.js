require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { producer } = require('../config/kafka');
const { savePayment } = require('../models/paymentModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(req, res) {
  try {
    const { amount, name, phone } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name,
      phone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, phone, amount } = req.body;
    const sign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (sign !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid signature' });

    const paymentData = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      name,
      phone,
      amount,
      status: 'success'
    };
  
    const paymentAllData ={
      orderId : razorpay_payment_id,
      paymentId
    }

    await savePayment(paymentData);

    await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [{ value: JSON.stringify(paymentData) }]
    });

    res.json({ message: 'Payment verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
}

module.exports = { createOrder, verifyPayment };
