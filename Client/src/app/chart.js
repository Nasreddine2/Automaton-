// ExecutionTimeChart.js
import React from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const ExecutionTimeChart = ({ isKMP, Times, egrepTimes }) => {
  React.useEffect(() => {
    const ctx = document.getElementById("executionTimeChart").getContext("2d");

    const chart = new Chart(ctx, {
      type: "bar", // Changez à 'line' si vous préférez un graphique linéaire
      data: {
        labels: Times.map((_, index) => `Iteration ${index + 1}`), // Labels pour chaque itération
        datasets: [
          {
            label: isKMP
              ? "KMP Temps d'Execution (ms)"
              : "Automate Temps d'Execution (ms)",
            data: Times,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "egrep Execution Time (ms)",
            data: egrepTimes,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Temps d'Execution (ms)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Iterations",
            },
          },
        },
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });

    // Cleanup the chart when the component unmounts
    return () => {
      chart.destroy();
    };
  }, [isKMP, Times, egrepTimes]);

  return <canvas id="executionTimeChart"></canvas>;
};

export default ExecutionTimeChart;
