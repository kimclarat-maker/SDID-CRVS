import { useEffect, useState } from "react";
import "./styles.css";
import { Badge } from "rsuite";
import { useFetchEnrollments } from "@/hooks/useFetchEnrollments";

type CountType = {
  totalApproved: number;
  totalPending: number;
  totalDraft: number;
};

function NotificationCount({ type }: { type: string }) {
  const [count] = useState(1);
  const [counts, setCount] = useState<CountType>({} as CountType);
  const { fetchEnrollmentData } = useFetchEnrollments();

  useEffect(() => {
    const getDataCounts = async () => {
      const filters = {
        offset: 0,
        limit: 1,
        status: type,
      };
      const pendingResult = await fetchEnrollmentData(filters);
      const totalPending = pendingResult?.total ?? 0;
      const approvedResult = await fetchEnrollmentData(filters);
      const totalApproved = approvedResult?.total ?? 0;
      const draftResult = await fetchEnrollmentData(filters);
      const totalDraft = draftResult?.total ?? 0;

      setCount({
        totalApproved,
        totalPending,
        totalDraft,
      });
    };
    // getDataCounts();
  }, []);

  useEffect(() => {}, []);

  if (type === "DRAFT" && counts.totalDraft > 0) {
    return (
      <div>
        <Badge content={counts.totalDraft} />
      </div>
    );
  }

  if (type === "PENDING" && counts.totalPending > 0) {
    return (
      <div>
        <Badge content={counts.totalPending} />
      </div>
    );
  }

  if (type === "APPROVED" && counts.totalApproved > 0) {
    return (
      <div>
        <Badge content={counts.totalApproved} />
      </div>
    );
  }

  return <></>;
}

export default NotificationCount;
