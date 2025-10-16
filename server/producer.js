const kafka = require('./kafkaClient');
const producer = kafka.producer();

async function run() {
  await producer.connect();

  const result = await producer.send({
    topic: 'test-topic',
    messages: [
      { key: 'key1', value: 'Hello from NodeJS to Kafka on Windows!' },
      { key: 'key2', value: 'Kafka is working 🎉' },
    ],
  });

  console.log('Messages sent:', result);
  await producer.disconnect();
}

run().catch(console.error);
