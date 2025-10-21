const express = require("express");
const Razorpay = require("razorpay");
const { sendPaymentNotification } = require("../kafka/Producer");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: "rzp_test_RW0UtjfH41ooGV",         
  key_secret: "ZakeoIp35w0N7KraQ1OJvz7t",  
});

router.post("/create-order", async (req, res) => {
  const { amount, currency, receipt } = req.body;

  const options = {
    amount: amount * 100,
    currency: currency || "INR",
    receipt: receipt || `rcpt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/payment-success", async (req, res) => {
  const payment = req.body;

  try {
    await sendPaymentNotification(payment);
    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send Kafka message" });
  }
});

module.exports = router;
