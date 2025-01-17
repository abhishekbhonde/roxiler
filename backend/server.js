// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const transactionRoutes = require('./routes/transactions');
require('dotenv').config();
const app = express();

console.log(process.env.MONGO_URL)
// Connect to MongoDB (replace with your DB URI if not using localhost)
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

app.use(cors());
app.use(bodyParser.json());

// Register the transaction routes
app.use('/api/transactions', transactionRoutes);

// Set up the port for the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
