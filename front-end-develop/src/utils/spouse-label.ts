import { translations } from "@/internationalization";

export const formatSpouseNameByMaritalStatus = ({
  status = "",
  type,
  defaultLanguage,
}: {
  status: string;
  type: string;
  defaultLanguage: string;
}) => {
  // Convert status to uppercase once for consistency
  const normalizedStatus = status?.toUpperCase();

  // Check if the status is valid
  const isValidStatus =
    normalizedStatus === "MARRIED" ||
    normalizedStatus === "WIDOWED" ||
    normalizedStatus === "DIVORCED";

  // Return the appropriate translation based on type
  if (normalizedStatus === "MARRIED") {
    return translations[defaultLanguage].spouse;
  }
  if (isValidStatus) {
    if (type === "idNumber") {
      return translations[defaultLanguage].former_partner_id_number;
    } else if (type === "name") {
      return translations[defaultLanguage].former_partner_name;
    }
  }

  // Return undefined or a default value if no conditions are met
  return type === "idNumber"
    ? translations[defaultLanguage].spouseIDNumber
    : translations[defaultLanguage].spouse;
};
