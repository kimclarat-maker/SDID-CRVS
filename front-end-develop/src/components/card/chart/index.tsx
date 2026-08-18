import Empty from "@/components/empty";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { ChartType } from "@/types/Chart";
import React, { useContext, useEffect, useState } from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const DynamicSrollableChart = ({
  children,
  labels,
}: {
  children: React.ReactNode;
  labels: string[];
}) => {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${Math.max(1000, labels.length * 100)}px`,
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Chart: React.FC<ChartType> = ({
  labels,
  loading,
  backgroundColor,
  borderColor,
  chartData,
  type,
  height,
  position = "bottom",
}) => {
  const [data, setData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderRadius?: number;
      barPercentage?: number;
    }[];
  }>({
    labels: [],
    datasets: [],
  });

  const { translation } = useContext(LanguageContext);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
        beginAtZero: true,
        min: 0,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        display: true,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (!data || !data.datasets.length) return [];
            return data.labels!.map((label: any, i: number) => {
              const value = data.datasets[0].data[i] as number;
              const bgColor = data.datasets[0].backgroundColor?.[i] as string;
              return {
                text: ` ${label} (${value})`,
                fillStyle: bgColor,
                strokeStyle: bgColor,
                hidden: !chart.getDataVisibility(i),
                index: i,
              };
            });
          },
        },
      },
    },
  };

  useEffect(() => {
    setData({
      labels,
      datasets: [
        {
          label: "",
          data: chartData,
          backgroundColor,
          borderColor,
          borderRadius: 15,
          barPercentage: 0.4,
        },
      ],
    });
  }, [loading, labels, chartData, backgroundColor, borderColor]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : labels?.length > 0 ? (
        type === "doughnut" ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Doughnut data={data} options={doughnutOptions} height={height} />
          </div>
        ) : type === "bar" ? (
          <DynamicSrollableChart labels={labels}>
            <Bar data={data} options={options} height={height} />
          </DynamicSrollableChart>
        ) : (
          <Line data={data} options={options} height={height} />
        )
      ) : (
        <div style={{ minHeight: 300 }}>
          <Empty title={translation.no_data} />
        </div>
      )}
    </>
  );
};

export default Chart;
