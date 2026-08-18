import { translations } from "@/internationalization";

export const searchOptions = (lng: string, type?: string) => {
  return [
    (type === "approved" || type === "entry") && {
      label: translations[lng].enrollment_number,
      value: "enrollmentNo",
    },
    {
      label: translations[lng].prenrollment_number,
      value: "prenrollmentNo",
    },
    {
      label: translations[lng].id_number,
      value: "idNumber",
    },
    {
      label: translations[lng].application_number,
      value: "applicationNumber",
    },
    {
      label: translations[lng].custom_search,
      value: "custom",
    },
  ].filter(Boolean);
};
