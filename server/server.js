require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const paymentRoutes = require('./routes/paymentRoutes');
const { initProducer } = require('./kafka/Producer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => res.send('Backend running'));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await initProducer(); 
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Server failed to start', err);
  }
})();
