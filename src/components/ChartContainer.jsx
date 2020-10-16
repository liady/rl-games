import React, { useEffect } from "react";
import { Chart } from "chart.js";

let myChart;
export function ChartContainer() {
  useEffect(() => {
    initChart();
  });
  return (
    <div style={{ marginLeft: "25px" }}>
      <canvas
        style={{ pointerEvents: "none" }}
        id="myChart"
        width="800"
        height="500"
      ></canvas>
    </div>
  );
}

export function setChartData(newData) {
  myChart.data.labels = newData.map((_, ind) => ind);
  myChart.data.datasets[0].data = newData;
  myChart.update(0);
}

function initChart() {
  var ctx = document.getElementById("myChart");
  Chart.defaults.global.defaultFontFamily = "minecraftiaregular";
  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Rewards",
          data: [],
          borderColor: ["rgba(255, 99, 132, 1)"],
          borderWidth: 4,
        },
      ],
    },
    options: {
      line: {
        borderWidth: 8,
      },
      legend: {
        display: true,
        labels: {
          boxWidth: 0,
          fontColor: "rgba(255, 99, 132, 1)",
        },
      },
    },
  });
}
