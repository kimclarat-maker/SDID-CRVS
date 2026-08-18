import Counts from "./counts";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchGeneralAnalytics } from "@/hooks/useAnalytics";
import Loading from "@/components/loader";
import BioChart from "./bioChart";
import moment from "moment";
import Filters from "./filters";

function All({ tab }: { tab: string }) {
  const { translation } = useContext(LanguageContext);
  const [filters, setFilters] = useState({
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
  });

  const { analyticsData, loadingAnalytics, fetchGeneralAnalyticsData } =
    useFetchGeneralAnalytics();

  const fetchData = (params: any) => {
    fetchGeneralAnalyticsData({
      ...params,
      status: "APPROVED",
    });
  };

  useEffect(() => {
    if (!tab || tab !== "all") return;
    fetchData(filters);
  }, [filters, tab]);

  return (
    <>
      <Filters filters={filters} setFilters={setFilters} />
      <br />
      {loadingAnalytics ? (
        <>
          <Loading isFullScreen />
        </>
      ) : (
        analyticsData && (
          <>
            <Counts
              counts={["all", "completed", "rollbacks", "missed"]}
              {...analyticsData}
              totalBiometricCaptured={analyticsData.totalBiometricsCaptured}
              filters={{}}
              loading={loadingAnalytics}
              totalMissedAppointment={analyticsData.missedAppointments}
              completedToday={analyticsData.completedToday}
              totalRollBacks={analyticsData.totalRollBacks}
            />
            <br />
            <div>
              <div className="row">
                <div className="col-md-8">
                  <BioChart
                    type="bar"
                    title={translation.daily_biometrics_captured}
                    data={analyticsData.dailyBiometrics}
                  />
                  <br />
                  <div className="row">
                    <div className="col-md-6">
                      <BioChart
                        type="bar"
                        title={translation.monthly_biometrics_captured}
                        data={analyticsData.monthlyBiometrics}
                      />
                    </div>
                    <div className="col-md-6">
                      <BioChart
                        type="bar"
                        title={translation.region_biometrics_captured}
                        data={analyticsData.monthlyBiometrics}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="col-md-12">
                    <BioChart
                      type="doughnut"
                      title={translation.biometrics_captured_per_gender}
                      backgroundColor={["#2563EB", "#0D9488"]}
                      borderColor={["#2563EB", "#0D9488"]}
                      data={{
                        data: [
                          analyticsData.totalMale,
                          analyticsData.totalFemale,
                        ],
                        labels: [translation.male, translation.female],
                      }}
                      position="right"
                      height={180}
                    />
                  </div>
                  <br />
                  <div className="col-md-12">
                    <BioChart
                      type="bar"
                      title={translation.day_of_weeks_biometrics_captured}
                      data={analyticsData.dayOfWeeks}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </>
  );
}

export default All;
