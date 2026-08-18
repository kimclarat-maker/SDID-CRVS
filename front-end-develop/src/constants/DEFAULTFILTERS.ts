import moment from "moment";

export const getDefaultDates = (nDays: number) => {
  return {
    startDate: moment()
      .startOf("d")
      .subtract(nDays, "d")
      .format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("d").format("YYYY-MM-DD HH:mm"),
  };
};
