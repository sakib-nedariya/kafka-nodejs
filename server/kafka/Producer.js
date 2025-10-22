const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'payment-producer',
  brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(',')
});

const producer = kafka.producer();

async function initProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}

async function publishMessage(topic, message) {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }]
  });
  console.log('Payment message sent to Kafka');
}

module.exports = { initProducer, publishMessage };
