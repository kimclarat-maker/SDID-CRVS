import Button from "@/components/button";
import Card from "@/components/card";
import Chart from "@/components/card/chart";
import ChartTableView from "@/components/card/chart/tableView";
import Header from "@/components/header";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";

function BioChart({
  data,
  type = "bar",
  title,
  borderColor,
  backgroundColor,
  height,
  position,
}: {
  data: any;
  type: string;
  title: string;
  borderColor?: string[];
  backgroundColor?: string[];
  position?: string;
  height?: number;
}) {
  const { translation } = useContext(LanguageContext);
  const [open, setOpenModal] = useState(false);

  const chartFormat = (data: any) => {
    if (type === "doughnut") return data;
    let labels: any = [],
      chartData: any = [];
    data.forEach((item: any) => {
      labels.push(item.date || item.center);
      chartData.push(item.total);
    });

    return {
      labels,
      data: chartData,
    };
  };

  return (
    <div data-testid="biometricChart">
      <Card
        styles={{
          boxShadow: "var(--card-shadow)",
          height: 450,
        }}
        header={
          <Header
            containerStyles={{
              backgroundColor: "transparent",
            }}
            title={title}
            titleStyles={{
              fontSize: 16,
            }}
            rightContent={
              data?.length > 0 && (
                <Button
                  text={translation.view}
                  onClick={() => setOpenModal(true)}
                  size="xs"
                />
              )
            }
          />
        }
      >
        <Chart
          type={type}
          name={title}
          labels={chartFormat(data)?.labels || []}
          chartData={chartFormat(data)?.data || []}
          backgroundColor={backgroundColor || "#2563EB"}
          borderColor={borderColor || "#2563EB"}
          height={height || 360}
          position={position || "bottom"}
        />
      </Card>
      <Modal show={open} handleClose={() => setOpenModal(false)} title={title}>
        <ChartTableView data={data} />
      </Modal>
    </div>
  );
}

export default BioChart;
