require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { producer, consumer } = require('./config/kafka');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(bodyParser.json());
app.use('/api', paymentRoutes);

app.get('/', (req, res) => res.send('Payment Notification Backend Running'));

async function startServer() {
  try {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: false });

    consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        console.log('Received Kafka event:', data);

        await sendSms(data.phone, `Hi ${data.name}, your payment of ₹${data.amount} was successful.`);
        await sendSms(data.phone, `Debit alert: ₹${data.amount} debited for order ${data.orderId}.`);
      },
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Error starting server:', err);
  }
}

startServer();
