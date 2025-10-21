const kafka = require("../config/kafka");

const producer = kafka.producer();

const sendPaymentNotification = async (payment) => {
  await producer.connect();
  await producer.send({
    topic: "test-topic",
    messages: [{ value: JSON.stringify(payment) }],
  });
  console.log("Kafka notification sent:", payment);
  await producer.disconnect();
};

module.exports = { sendPaymentNotification };
