const kafka = require("../config/kafka");

const consumer = kafka.consumer({ groupId: "payment-group" });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "payment-notifications", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Received Kafka message:", message.value.toString());
    },
  });
};

module.exports = { startConsumer };
