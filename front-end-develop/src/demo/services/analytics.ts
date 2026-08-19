import { demoDelay } from "../config";
import { getDemoData } from "../storage/demoStore";

// Shape matches what screens/dashboard/admin/analyticsV2 expects from the
// real /aggregates endpoint (hourly_count, hours_included,
// district_aggregates, hourly_breakdown, histogram_data).
export const demoGetAggregates = async () => {
  const db = getDemoData();

  const districtAggregates: Record<string, number> = {};
  db.applicants.forEach((a) => {
    districtAggregates[a.district] = (districtAggregates[a.district] || 0) + 1;
  });

  const histogramData: Record<string, number> = {};
  db.applications.forEach((app) => {
    const officer = db.accounts.find((acc) => acc.id === app.officerId);
    const key = officer ? `${officer.firstName} ${officer.lastName}` : "Unassigned";
    histogramData[key] = (histogramData[key] || 0) + 1;
  });

  const hourlyBreakdown = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 7;
    return {
      hour,
      enrollment: 2 + ((hour * 3 + db.applications.length) % 9),
    };
  });

  return demoDelay({
    hourly_count: db.applications.length,
    hours_included: hourlyBreakdown.length,
    district_aggregates: districtAggregates,
    hourly_breakdown: hourlyBreakdown,
    histogram_data: histogramData,
  });
};
