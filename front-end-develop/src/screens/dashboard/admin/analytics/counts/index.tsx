import CardCount from "@/components/card/count";
import { LanguageContext } from "@/context/LanguageContext";
import { convertObjectIntoUrlParams } from "@/utils/common/convertObjectIntoUrlParams";
import moment from "moment";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { start } from "repl";

function Counts({
  totalBiometricCaptured = 0,
  filters,
  loading,
  totalMissedAppointment = 0,
  completedToday = 0,
  totalRollBacks = 0,
  counts,
  status,
}: {
  totalBiometricCaptured?: number;
  filters: any;
  loading: boolean;
  totalMissedAppointment?: number;
  completedToday?: number;
  totalRollBacks?: number;
  counts: string[];
  status?: string;
  total?: number;
  totalMale?: number;
  totalFemale?: number;
}) {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();

  const size = `col-md-${
    counts.length === 1
      ? 12
      : counts.length === 2
      ? 6
      : counts.length === 3
      ? 4
      : counts.length === 4
      ? 3
      : 12
  }`;

  return (
    <div className="row" data-testid="counts">
      {counts.includes("all") && (
        <div className={size}>
          <CardCount
            name={translation.total_biometric_captured}
            count={totalBiometricCaptured}
            color="var(--color-primary-500)"
            icon="visibility"
            onClick={() =>
              navigate(
                `/dashboard/admin/enrollment?${convertObjectIntoUrlParams({
                  ...(filters || {}),
                  status: "APPROVED",
                })}`
              )
            }
            loading={loading}
          />
        </div>
      )}
      {counts.includes("pending") && (
        <div className={size}>
          <CardCount
            name={translation.total}
            count={completedToday}
            color="var(--status-warning)"
            icon="calendar_month"
            onClick={() =>
              navigate(
                `/dashboard/admin/request/pending?${convertObjectIntoUrlParams({
                  ...(filters || {}),
                  status: "APPROVED",
                })}`
              )
            }
            loading={loading}
          />
        </div>
      )}
      {counts.includes("completed") && (
        <div className={size}>
          <CardCount
            name={translation.completed_today}
            count={completedToday}
            color="var(--status-success)"
            icon="calendar_month"
            onClick={() =>
              navigate(
                `/dashboard/admin/enrollment?${convertObjectIntoUrlParams({
                  ...(filters || {}),
                  startDate: moment().startOf("day").format("YYYY-MM-DD HH:mm"),
                  endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
                  status: "APPROVED",
                })}`
              )
            }
            loading={loading}
          />
        </div>
      )}
      {counts.includes("rollbacks") && (
        <div className={size}>
          <CardCount
            name={translation.roll_back}
            count={totalRollBacks}
            color="var(--color-accent-600)"
            icon="avg_pace"
            onClick={() =>
              navigate(
                `/dashboard/admin/rollback?${convertObjectIntoUrlParams({
                  ...(filters || {}),
                  status,
                })}`
              )
            }
            loading={loading}
          />
        </div>
      )}
      {counts.includes("missed") && (
        <div className={size}>
          <CardCount
            name={translation.missed_appointments}
            count={totalMissedAppointment}
            color="var(--status-danger)"
            icon="calendar_month"
            onClick={() =>
              navigate(
                `/dashboard/admin/missed_appointments?${convertObjectIntoUrlParams(
                  {
                    ...(filters || {}),
                    status,
                  }
                )}`
              )
            }
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default Counts;
