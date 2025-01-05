import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    LineElement,
    BarElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
  } from 'chart.js';
  
  ChartJS.register(LineElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);
  
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(LinearScale, CategoryScale, BarElement, ArcElement, Tooltip, Legend);

const ChartComponent: React.FC = () => {
  const chartRef = useRef<any>(null);

  // Example data and options
  const barData = {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [
      {
        label: 'Sales',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
  };

  const pieData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Votes',
        data: [300, 50, 100],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { enabled: true },
    },
  };

  return (
    <div>
      <h2>Bar Chart</h2>
      <Bar ref={chartRef} data={barData} options={barOptions} />

      <h2>Pie Chart</h2>
      <Pie data={pieData} options={pieOptions} />
    </div>
  );
};

export default ChartComponent;
