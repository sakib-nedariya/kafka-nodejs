const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const paymentRoutes = require("./routes/Payments");
const { startConsumer } = require("./kafka/Consumer");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/payment", paymentRoutes);

startConsumer().catch(console.error);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
