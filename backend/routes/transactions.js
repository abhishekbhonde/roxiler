const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const router = express.Router();


router.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    await Transaction.deleteMany({});

    const transactionDocs = transactions.map(transaction => ({
      title: transaction.title,
      description: transaction.description,
      price: transaction.price,
      category: transaction.category,
      dateOfSale: new Date(transaction.dateOfSale),
      sold: transaction.sold,
    }));

    await Transaction.insertMany(transactionDocs);

    res.status(200).json({ message: 'Database initialized with seed data' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error initializing database' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;

    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    const filter = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, parseInt(month)]
      }
    };

    let query = Transaction.find(filter);

    if (search) {
      const isNumericSearch = !isNaN(search);

      if (isNumericSearch) {
        query = query.or([
          { price: parseFloat(search) },
        ]);
      } else {
        query = query.or([
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]);
      }
    }

    const countQuery = query.clone();

    const start = (page - 1) * perPage;
    const end = page * perPage;

    const totalTransactions = await countQuery.countDocuments();

    const transactions = await query.skip(start).limit(perPage);

    res.json({
      transactions,
      total: totalTransactions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalTransactions / perPage),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    const filter = { 
      $expr: { 
        $eq: [{ $month: "$dateOfSale" }, parseInt(month)] }
    };

    const statistics = await Transaction.aggregate([
      { $match: filter },
      { $group: { 
        _id: null,
        totalAmount: { $sum: "$price" },
        totalItemsSold: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
        totalItemsNotSold: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } }
      }}
    ]);

    res.json(statistics[0] || { totalAmount: 0, totalItemsSold: 0, totalItemsNotSold: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

router.get('/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    const filter = { 
      $expr: { 
        $eq: [{ $month: "$dateOfSale" }, parseInt(month)] }
    };

    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity },
    ];

    const result = await Promise.all(priceRanges.map(async range => {
      const count = await Transaction.countDocuments({
        ...filter,
        price: { $gte: range.min, $lte: range.max },
      });
      return {
        range: `${range.min} - ${range.max}`,
        count,
      };
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bar chart data' });
  }
});

router.get('/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    const filter = { 
      $expr: { 
        $eq: [{ $month: "$dateOfSale" }, parseInt(month)] }
    };

    const result = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", items: "$count", _id: 0 } },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching pie chart data' });
  }
});

router.get('/combined', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    const [statistics, barChartData, pieChartData] = await Promise.all([
      axios.get(`http://localhost:5000/api/transactions/statistics?month=${month}`),
      axios.get(`http://localhost:5000/api/transactions/bar-chart?month=${month}`),
      axios.get(`http://localhost:5000/api/transactions/pie-chart?month=${month}`),
    ]);

    res.json({
      statistics: statistics.data,
      barChartData: barChartData.data,
      pieChartData: pieChartData.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching combined data' });
  }
});

module.exports = router;
