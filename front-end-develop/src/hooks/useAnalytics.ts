import { fetchGeneralAnalytics } from "@/api/analytics";
import {
  BiometricsData,
  GETParameters,
  MonthlyBiometricEntry,
} from "@/types/Analytics";
import moment from "moment";
import { useState } from "react";

export const useFetchGeneralAnalytics = () => {
  const [loadingAnalytics, setLoading] = useState(false);
  const [analyticsData, setData] = useState<
    | {
        totalBiometricsCaptured: 0;
        completedToday: 0;
        totalRollBacks: 0;
        missedAppointments: 0;
        dailyBiometrics: {};
        monthlyBiometrics: [];
        totalFemale: 0;
        totalMale: 0;
        total: 0;
        centerBiometrics: [];
        dayOfWeeks: {};
      }
    | BiometricsData
  >();

  const fetchGeneralAnalyticsData = async (params?: GETParameters) => {
    setLoading(true);

    if (!params?.startDate || !params?.endDate) return;

    delete params.dashboardType;

    try {
      const response = await fetchGeneralAnalytics(params);
      if (response && response.data) {
        let res = response.data;

        setData({
          ...res,
          centerBiometrics: returnCenterRequests(
            res.centerBiometrics,
            params.startDate,
            params.endDate
          ),
          dailyBiometrics: returnDailyRequests(res.dailyBiometrics),
          dayOfWeeks: returnDayOfWeeks(res.dailyBiometrics),
          monthlyBiometrics: returnMonthly(res.monthlyBiometrics),
        });
      }
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    loadingAnalytics,
    fetchGeneralAnalyticsData,
    setLoading,
  };
};

// Function to get the day of the week from a date string
const getDayOfWeek = (dateString: string) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// Function to get the month name from a date string
const getMonthName = (dateString: string) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[months.indexOf(dateString)];
};

const returnDayOfWeeks = (data: any = []) => {
  // Initialize all days with total = 0
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let dates: any = {};
  const groupedData = daysOfWeek.reduce((acc: any, day: string) => {
    acc[day] = 0; // Initialize each day with total = 0
    return acc;
  }, {});

  // Group and sum totals by day of the week
  data.forEach((item: any) => {
    const day = getDayOfWeek(item.date);
    dates[day] = item.date;
    groupedData[day] += item.total; // Update the total for the day
  });

  // Convert the grouped data into the desired format
  return Object.keys(groupedData).map((day) => ({
    name: day,
    date: dates[day],
    total: groupedData[day],
    startDate: dates[day],
    endDate: dates[day]
      ? moment(dates[day]).startOf("D").format("YYYY-MM-DD HH:mm")
      : undefined,
  }));
};

const returnMonthly = (data: any[]) => {
  // Initialize all months with total = 0
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const groupedData = months.reduce((acc: any, month: string) => {
    acc[month] = 0; // Initialize each month with total = 0
    return acc;
  }, {});

  let dates: any = {};

  // Group and sum totals by month
  data.forEach((item: any) => {
    const month = getMonthName(item.month);

    dates[month] = {
      startDate: item.startDate,
      endDate: item.endDate,
    };
    groupedData[month] += item.total; // Update the total for the month
  });

  // Convert the grouped data into the desired format
  return Object.keys(groupedData).map((month) => ({
    date: month,
    total: groupedData[month],
    startDate: dates[month]?.startDate,
    endDate: dates[month]?.endDate,
  }));
};

const returnDailyRequests = (data: any = []) => {
  return data?.map((el: any) => {
    return {
      ...el,
      startDate: el.date,
      endDate: moment(el.date).endOf("d").format("YYYY-MM-DD HH:mm"),
    };
  });
};

const returnCenterRequests = (
  data: any = [],
  startDate: string,
  endDate: string
) => {
  return data?.map((el: any) => {
    return {
      ...el,
      startDate,
      endDate,
    };
  });
};
