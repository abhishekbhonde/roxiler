import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const API_BASE_URL = "http://localhost:5000/api/transactions";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Transaction {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  sold: boolean;
  image: string;
}

interface Statistics {
  totalAmount: number;
  totalItemsSold: number;
  totalItemsNotSold: number;
}

const Dashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("3"); // Default to March
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [pieChartData, setPieChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCombinedData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/combined`, {
        params: { month: selectedMonth },
      });
      setStatistics(response.data.statistics || {});
      setBarChartData(response.data.barChartData || []);
      setPieChartData(response.data.pieChartData || []);
    } catch (err) {
      setError("Failed to fetch combined data.");
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { month: selectedMonth, page },
      });
      setTransactions(response.data.transactions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError("Failed to fetch transactions.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchCombinedData(), fetchTransactions()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, page]);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center text-teal-400">
          Dashboard
        </h1>
  
        {/* Month Selector */}
        <div className="mb-8 flex justify-center">
          <select
            className="bg-gray-800 text-white p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
  
        {loading ? (
          <p className="text-center text-teal-400">Loading data...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="overflow-x-auto mb-8">
              <h2 className="text-2xl font-bold mb-4 text-teal-400 text-center">
                Transactions Table
              </h2>
              <table className="table-auto w-full bg-gray-800 text-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2">Image</th>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-700">
                      <td className="px-4 py-2">
                        <img
                          src={transaction.image}
                          alt={transaction.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </td>
                      <td className="px-4 py-2">{transaction.title}</td>
                      <td className="px-4 py-2">{transaction.description}</td>
                      <td className="px-4 py-2">${transaction.price}</td>
                      <td className="px-4 py-2">{transaction.category}</td>
                      <td className="px-4 py-2">
                        {transaction.sold ? (
                          <span className="text-green-500">Yes</span>
                        ) : (
                          <span className="text-red-500">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
            {/* Pagination */}
            <div className="flex justify-center mt-8 mb-8 space-x-4">
              <button
                className="px-6 py-2 bg-teal-400 text-white rounded-lg shadow-md hover:bg-teal-500 disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                className="px-6 py-2 bg-teal-400 text-white rounded-lg shadow-md hover:bg-teal-500 disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
  
            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-lg font-semibold text-teal-400">
                    Total Sale
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    ${statistics.totalAmount}
                  </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-lg font-semibold text-teal-400">
                    Sold Items
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {statistics.totalItemsSold}
                  </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-lg font-semibold text-teal-400">
                    Not Sold Items
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {statistics.totalItemsNotSold}
                  </p>
                </div>
              </div>
            )}
  
            {/* Bar Chart */}
            {barChartData && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-teal-400 text-center">
                  Transactions by Price Range
                </h2>
                <Bar
                  data={{
                    labels: barChartData.map((item: any) => item.range),
                    datasets: [
                      {
                        label: "Transactions",
                        data: barChartData.map((item: any) => item.count),
                        backgroundColor: "#14b8a6",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true },
                      x: {
                        barThickness: 12,  // Adjust bar thickness further for smaller display
                      },
                    },
                  }}
                  height={150}  // Adjusted for better size
                  width={300}   // Adjusted for better size
                />
              </div>
            )}
  
            {/* Pie Chart */}
            {pieChartData && (
              <div className="mb-8 h-[730px] mr-auto ml-auto flex items-center justify-center flex-col mt-[150px]">
                <h2 className="text-2xl font-bold mb-4 text-teal-400 text-center">
                  Transactions by Category
                </h2>
                <Pie
                  data={{
                    labels: pieChartData.map((item: any) => item.category),
                    datasets: [
                      {
                        data: pieChartData.map((item: any) => item.items),
                        backgroundColor: [
                          "#14b8a6",
                          "#2dd4bf",
                          "#5eead4",
                          "#99f6e4",
                          "#ccfbf1",
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "top" } },
                  }}
                  height={250} // Adjusted size for better fit
                  width={200}  // Adjusted size for better fit
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
