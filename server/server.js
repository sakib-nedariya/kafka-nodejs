require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Kafka } = require('kafkajs');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'payment-app',
  brokers: [ process.env.KAFKA_BROKER || 'localhost:9092' ]
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'notification-service-group' });

// Twilio setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const TWILIO_FROM = process.env.TWILIO_FROM;

// Simple health
app.get('/', (req, res) => res.send('Backend up'));

/**
 * Create an order (Razorpay) for the amount (INR). Frontend will call this before opening Checkout.
 * req.body = { amount, name, phone }  -- amount in rupees
 */
app.post('/create-order', async (req, res) => {
  try {
    const { amount, name, phone } = req.body;
    if (!amount || !phone) return res.status(400).json({ error: 'amount and phone required' });

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
      name: name || 'Test User',
      phone: phone
    });
  } catch (err) {
    console.error('create-order err', err);
    return res.status(500).json({ error: 'create-order failed' });
  }
});

/**
 * Handle client-side payment success. Client posts razorpay_payment_id, razorpay_order_id, razorpay_signature and customer data.
 * We verify signature, then produce to Kafka for the notification worker.
 */
app.post('/payment/success', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, name, phone, amount } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'missing payment fields' });
    }

    // verify signature
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // produce event to Kafka
    const event = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount || 0,
      name: name || 'Customer',
      phone: phone,
      timestamp: Date.now()
    };

    await producer.send({
      topic: 'payments',
      messages: [
        { key: event.orderId, value: JSON.stringify(event) }
      ]
    });

    return res.json({ status: 'ok', event });
  } catch (err) {
    console.error('payment/success err', err);
    return res.status(500).json({ error: 'payment handling failed' });
  }
});

async function start() {
  // connect producer & consumer
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'payments', fromBeginning: false });

  // consumer will send SMS
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log('Consumer received:', event);

        // Send customer notification
        const customerMsg = `Hi ${event.name}, we received your payment of ₹${event.amount}. Payment ID: ${event.paymentId}`;
        await sendSms(event.phone, customerMsg);

        // Simulated debit message (you can change content)
        const debitMsg = `Debit alert: ₹${event.amount} debited from your account for order ${event.orderId}.`;
        await sendSms(event.phone, debitMsg);

        console.log('Notifications sent for', event.orderId);
      } catch (err) {
        console.error('Error handling message', err);
      }
    }
  });

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

async function sendSms(to, body) {
  if (!TWILIO_FROM || !process.env.TWILIO_SID) {
    console.log('Twilio not configured. Skipping SMS. Message that would be sent:', { to, body });
    return;
  }
  try {
    await twilioClient.messages.create({
      from: TWILIO_FROM,
      to: to,
      body: body
    });
  } catch (err) {
    console.error('Twilio send error', err);
  }
}

start().catch(err => {
  console.error('Startup error', err);
  process.exit(1);
});
