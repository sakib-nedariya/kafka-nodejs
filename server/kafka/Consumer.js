const { Kafka } = require('kafkajs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'payment-consumer',
  brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(',')
});

const consumer = kafka.consumer({ groupId: 'email-group' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     
    pass: process.env.EMAIL_PASS      
  }
});

async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });
  console.log('Kafka consumer listening...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payment = JSON.parse(message.value.toString());
      console.log('Sending email for payment:', payment);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: payment.email,
        subject: 'Payment Successful!',
        text: `Hi ${payment.name},\n\nYour payment of ₹${payment.amount} was successful.\nOrder ID: ${payment.orderId}\n\nThank you!`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Email failed:', err);
        else console.log('Email sent:', info.response);
      });
    }
  });
}

runConsumer().catch(console.error);
