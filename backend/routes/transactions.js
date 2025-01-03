const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction'); // Import the Transaction model
const router = express.Router();

// Initialize the database with seed data from the third-party API
router.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Clear existing data in the database
    await Transaction.deleteMany({});

    // Prepare the data to insert into the database
    const transactionDocs = transactions.map(transaction => ({
      title: transaction.title,
      description: transaction.description,
      price: transaction.price,
      category: transaction.category,
      dateOfSale: new Date(transaction.dateOfSale), // Ensure the date is a Date object
      sold: transaction.sold,
    }));

    // Insert data into the database
    await Transaction.insertMany(transactionDocs);

    res.status(200).json({ message: 'Database initialized with seed data' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error initializing database' });
  }
});

// List transactions with search and pagination
router.get('/', async (req, res) => {
    try {
      const { month, search, page = 1, perPage = 10 } = req.query;
  
      if (!month) {
        return res.status(400).json({ message: 'Month parameter is required' });
      }
  
      const filter = {
        // Use the $month operator to match the month part of dateOfSale
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, parseInt(month)]
        }
      };
  
      let query = Transaction.find(filter);
  
      // Apply search if the search query is provided
      if (search) {
        const isNumericSearch = !isNaN(search); // Check if the search query is numeric
  
        if (isNumericSearch) {
          // If the search is a number, search within the price field
          query = query.or([
            { price: parseFloat(search) }, // Convert the search to a float for numeric comparison
          ]);
        } else {
          // Otherwise, apply the search for title, description, or price
          query = query.or([
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ]);
        }
      }
  
      // Clone the query to reuse it for the countDocuments call
      const countQuery = query.clone();
  
      // Pagination logic
      const start = (page - 1) * perPage;
      const end = page * perPage;
  
      // Get the total number of matching transactions (without pagination)
      const totalTransactions = await countQuery.countDocuments();
  
      // Fetch the actual transactions with pagination applied
      const transactions = await query.skip(start).limit(perPage);
  
      // Return paginated transactions with total count and pages
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
  
  
// Statistics API - Get total sales, sold items, and not sold items for a given month
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

// Bar Chart Data API - Get item count for different price ranges in a given month
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

    // Define price ranges
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

    // Query the database and count items within each price range
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

// Pie Chart Data API - Get the number of items per category for a given month
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

// Combined API - Get statistics, bar chart, and pie chart data for the given month
router.get('/combined', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required' });
    }

    // Fetch all necessary data in parallel
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
