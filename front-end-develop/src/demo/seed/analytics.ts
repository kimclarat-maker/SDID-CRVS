import { DemoAnalyticsMonth } from "../types";

const MONTHS = 6;

export const seedAnalytics = (): DemoAnalyticsMonth[] => {
  const now = new Date();

  return Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    const month = d.toISOString().slice(0, 7);
    const submitted = 60 + i * 8 + (i % 2 === 0 ? 5 : 0);
    const approved = Math.round(submitted * 0.7);
    const rejected = Math.round(submitted * 0.1);
    const pending = submitted - approved - rejected;

    return {
      month,
      submitted,
      approved,
      rejected,
      pending,
      avgProcessingDays: 3 + (i % 4),
    };
  });
};
