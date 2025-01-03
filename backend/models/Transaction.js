const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  dateOfSale: Date,
  sold: Boolean,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
