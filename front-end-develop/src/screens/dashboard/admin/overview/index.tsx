import { useEffect, useState } from "react";
import { Table as LibTable } from "rsuite";
import Health from "@/components/health";
import Card from "@/components/card";
import CardCount from "@/components/card/count";
import Chart from "@/components/card/chart";
import Table from "@/components/table";
import { useLocalService } from "@/context/LocalServiceContext";
import { fetchGeneralAnalytics } from "@/api/analytics";
import "./styles.css";

const { Column, HeaderCell, Cell } = LibTable;

type CenterRow = {
  _id: string | number;
  center: string;
  completed: number;
  scheduled: number;
  rollBacks: number;
};

type OverviewData = {
  totalBiometricsCaptured?: number;
  completedToday?: number;
  totalRollBacks?: number;
  missedAppointments?: number;
  dailyBiometrics?: { date: string; total: number }[];
  centers?: CenterRow[];
};

const formatShortDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  } catch {
    return isoDate;
  }
};

export default function Overview() {
  const {
    isOnline,
    isLocalServiceActive,
    retryLocalService,
    localServiceHealthData
  } = useLocalService();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: any = await fetchGeneralAnalytics({});
        setData(res?.data?.data || {});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const centers = [...(data.centers || [])].sort(
    (a, b) => b.completed - a.completed
  );
  const topCenters = centers.slice(0, 4);

  const trend = [...(data.dailyBiometrics || [])].slice(-14);
  const trendLabels = trend.map((d) => formatShortDate(d.date));
  const trendValues = trend.map((d) => d.total);

  return (
    <div className="overviewScreen">
      <Health
        isOnline={isOnline}
        isLocalServiceActive={isLocalServiceActive}
        retryLocalService={retryLocalService}
        localServiceHealthData={localServiceHealthData}
      />

      <div className="overviewStats">
        <CardCount
          name="Total biometrics captured"
          count={data.totalBiometricsCaptured || 0}
          icon="fingerprint"
          color="var(--color-primary-600)"
          loading={loading}
        />
        <CardCount
          name="Completed enrollments today"
          count={data.completedToday || 0}
          icon="task_alt"
          color="var(--status-success)"
          loading={loading}
        />
        <CardCount
          name="Total rollbacks"
          count={data.totalRollBacks || 0}
          icon="restart_alt"
          color="var(--status-warning)"
          loading={loading}
        />
        <CardCount
          name="Missed appointments"
          count={data.missedAppointments || 0}
          icon="event_busy"
          color="var(--status-danger)"
          loading={loading}
        />
      </div>

      <div className="overviewChartRow">
        <Card
          header={
            <div className="overviewCardHeader">
              <div>
                <div className="overviewCardTitle">
                  Daily biometrics captured
                </div>
                <div className="overviewCardSubtitle">Last 14 days</div>
              </div>
            </div>
          }
        >
          <div style={{ height: 260 }}>
            <Chart
              type="line"
              labels={trendLabels}
              chartData={trendValues}
              loading={loading}
              backgroundColor="rgba(7, 142, 206, 0.15)"
              borderColor="#078ece"
              height={260}
            />
          </div>
        </Card>

        <Card
          header={<div className="overviewCardTitle">Top centres</div>}
        >
          <div className="overviewTopCenters">
            {topCenters.map((c) => (
              <div className="overviewTopCenterRow" key={c._id}>
                <span className="overviewTopCenterDot"></span>
                <span className="overviewTopCenterName">{c.center}</span>
                <span className="overviewTopCenterValue">{c.completed}</span>
              </div>
            ))}
            {!loading && topCenters.length === 0 && (
              <div className="overviewEmptyNote">No centre data yet.</div>
            )}
          </div>
        </Card>
      </div>

      <Card
        header={<div className="overviewCardTitle">Enrollment centres</div>}
        styles={{ marginTop: "1.25rem" }}
      >
        <Table data={centers} loading={loading}>
          <Column flexGrow={1.4} minWidth={180}>
            <HeaderCell className="textBold">Centre</HeaderCell>
            <Cell dataKey="center" />
          </Column>
          <Column flexGrow={1}>
            <HeaderCell className="textBold">Completed</HeaderCell>
            <Cell dataKey="completed" />
          </Column>
          <Column flexGrow={1}>
            <HeaderCell className="textBold">Scheduled</HeaderCell>
            <Cell dataKey="scheduled" />
          </Column>
          <Column flexGrow={1}>
            <HeaderCell className="textBold">Rollbacks</HeaderCell>
            <Cell dataKey="rollBacks" />
          </Column>
          <Column flexGrow={1}>
            <HeaderCell className="textBold">Completion</HeaderCell>
            <Cell>
              {(rowData: CenterRow) => {
                const pct = rowData.scheduled
                  ? Math.round((rowData.completed / rowData.scheduled) * 100)
                  : 0;
                const tone =
                  pct >= 95 ? "success" : pct >= 80 ? "warning" : "danger";
                return (
                  <span className={`overviewCompletionPill ${tone}`}>
                    {pct}%
                  </span>
                );
              }}
            </Cell>
          </Column>
        </Table>
      </Card>
    </div>
  );
}
