const kafka = require("../config/kafka");

const consumer = kafka.consumer({ groupId: "payment-group" });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const paymentData = JSON.parse(message.value.toString());
      console.log("Received Kafka message:", paymentData);

    },
  });
};

module.exports = { startConsumer };
