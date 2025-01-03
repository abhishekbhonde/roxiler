// Required dependencies: axios, react-chartjs-2, tailwindcss
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Registering ChartJS components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

// Type definitions
interface Transaction {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface Statistics {
  totalSale: number;
  soldItems: number;
  notSoldItems: number;
}

interface BarChartData {
  labels: string[];
  data: number[];
}

const Dashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("March");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [statistics, setStatistics] = useState<Statistics>({
    totalSale: 0,
    soldItems: 0,
    notSoldItems: 0,
  });
  const [barChartData, setBarChartData] = useState<BarChartData>({
    labels: [],
    data: [],
  });

  const fetchTransactions = async () => {
    try {
      const response = await axios.get<{ transactions: Transaction[] }>("/api/transactions", {
        params: { month: selectedMonth, search: searchText, page },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get<Statistics>("/api/transactions/statistics", {
        params: { month: selectedMonth },
      });
      setStatistics(response.data || { totalSale: 0, soldItems: 0, notSoldItems: 0 });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics({ totalSale: 0, soldItems: 0, notSoldItems: 0 });
    }
  };

  const fetchBarChartData = async () => {
    try {
      const response = await axios.get<BarChartData>("/api/transactions/chart", {
        params: { month: selectedMonth },
      });
      setBarChartData({
        labels: response.data.labels || [],
        data: response.data.data || [],
      });
    } catch (error) {
      console.error("Error fetching bar chart data:", error);
      setBarChartData({ labels: [], data: [] });
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
  }, [selectedMonth, searchText, page]);

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Transactions Dashboard</h1>

        {/* Month Selector */}
        <select
          className="bg-gray-700 text-white p-2 rounded mb-4"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search transactions"
          className="bg-gray-700 text-white p-2 rounded mb-4 w-full max-w-md"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {/* Transactions Table */}
        <div className="overflow-x-auto w-full">
          <table className="table-auto w-full text-left border border-gray-600">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((transaction) => (
                <tr key={transaction.id} className="bg-gray-700">
                  <td className="px-4 py-2">{transaction.title}</td>
                  <td className="px-4 py-2">{transaction.description}</td>
                  <td className="px-4 py-2">${transaction.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Buttons */}
        <div className="flex justify-between w-full max-w-md mt-4">
          <button
            className="bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            className="bg-blue-500 px-4 py-2 rounded"
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-800 p-4 rounded text-center">
            <h3 className="text-lg font-bold">Total Sale</h3>
            <p>${statistics.totalSale}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <h3 className="text-lg font-bold">Sold Items</h3>
            <p>{statistics.soldItems}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center">
            <h3 className="text-lg font-bold">Not Sold Items</h3>
            <p>{statistics.notSoldItems}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="w-full max-w-2xl mt-8">
          <Bar
            data={{
              labels: barChartData.labels ?? [],
              datasets: [
                {
                  label: "Price Range",
                  data: barChartData.data ?? [],
                  backgroundColor: "#4f46e5",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
