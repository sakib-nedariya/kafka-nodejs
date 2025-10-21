const kafka = require("../config/kafka");

const producer = kafka.producer();

const sendPaymentNotification = async (payment) => {
  await producer.connect();
  await producer.send({
    topic: "payment-notifications",
    messages: [
      { value: JSON.stringify(payment) }
    ],
  });
  console.log("Payment notification sent to Kafka:", payment);
  await producer.disconnect();
};

module.exports = { sendPaymentNotification };
