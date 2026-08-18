import React, { useContext, useEffect, useState } from "react";
import Filters from "./filters";
import ExportData from "./export";
import Counts from "./counts";
import { getAggregates } from "@/api/analytics";
import { format } from "date-fns";
import Chart from "@/components/card/chart";
import Card from "@/components/card";
import capitalizeText from "@/utils/common/capitalizeText";
import { Text } from "rsuite";
import { LanguageContext } from "@/context/LanguageContext";

interface Props {}

const Analytics: React.FC<Props> = () => {
  const { translation } = useContext(LanguageContext);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [fromHour, setFromHour] = useState(7);
  const [toHour, setToHour] = useState(23);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aggregateData, setAggregateData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAggregates(selectedDate, null, fromHour, toHour);

      setAggregateData(data);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Filters
        fetchData={fetchData}
        loading={loading}
        setFromHour={(t: number) => setFromHour(t)}
        setToHour={(t: number) => setToHour(t)}
        setSelectedDate={setSelectedDate}
        fromHour={fromHour || 7}
        toHour={toHour || 23}
        selectedDate={selectedDate}
      />
      <br />

      <ExportData
        fromHour={fromHour || 7}
        toHour={toHour || 23}
        selectedDate={selectedDate}
      />
      <br />
      <Counts loading={false} aggregateData={aggregateData} />
      <br />
      <div className="row">
        <div className="col-md-12 mb-3">
          <div className="row">
            <div className="col-6">
              <Card header={<Text>{translation.district_distribution}</Text>}>
                <Chart
                  type="bar"
                  name={translation.district_distribution}
                  labels={Object.keys(
                    aggregateData?.district_aggregates || {}
                  )?.filter((el: any) => capitalizeText(el))}
                  chartData={Object.values(
                    aggregateData?.district_aggregates || {}
                  )?.filter((el: any) => el)}
                  backgroundColor={"rgba(7, 142, 206, 1)"}
                  borderColor={"#2563EB"}
                  height={300}
                />
              </Card>
            </div>
            {}
            <div className="col-6">
              <Card header={<Text>{translation.hourly_activity}</Text>}>
                <Chart
                  type="bar"
                  name="Hourly Activity"
                  labels={aggregateData?.hourly_breakdown?.map(
                    (el: any) => el.hour
                  )}
                  chartData={aggregateData?.hourly_breakdown?.map(
                    (el: any) => el.enrollment
                  )}
                  backgroundColor={"rgba(7, 142, 206, 1)"}
                  borderColor={"#2563EB"}
                  height={300}
                />
              </Card>
            </div>
          </div>
        </div>
        <br />
        <div className="col-md-12">
          <div className="row">
            <div className="col-6">
              <Card
                header={<Text>{translation.operator_prod_distribution}</Text>}
              >
                <Chart
                  type="bar"
                  name="Operator Productivity Distribution"
                  labels={Object.keys(
                    aggregateData?.histogram_data || {}
                  )?.filter((el: any) => capitalizeText(el))}
                  chartData={Object.values(
                    aggregateData?.histogram_data || {}
                  )?.filter((el: any) => el)}
                  backgroundColor={"rgba(7, 142, 206, 1)"}
                  borderColor={"#2563EB"}
                  height={300}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
