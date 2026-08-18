import { translations } from "@/internationalization";

export const appStatus = (lng: string, status: string) => {
  const res: { status: string } = { status };

  if (status?.toUpperCase() === "COMPLETE") {
    res.status = translations[lng]?.completed;
  } else if (status?.toUpperCase() === "APPROVED") {
    res.status = translations[lng]?.approved;
  } else if (status?.toUpperCase() === "PENDING") {
    res.status = translations[lng]?.pending;
  } else if (status?.toUpperCase() === "REJECTED") {
    res.status = translations[lng]?.rejected;
  } else if (status?.toUpperCase() === "DRAFT") {
    res.status = translations[lng]?.draft;
  } else if (
    status?.toUpperCase() === "ROLLBACK" ||
    status?.toUpperCase() === "ROLL BACK"
  ) {
    res.status = translations[lng]?.roll_back;
  }

  return res;
};
