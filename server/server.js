require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const paymentRoutes = require('./routes/PaymenRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => res.send('Backend running fine'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
