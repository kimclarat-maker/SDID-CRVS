import { fetchApplicantByDocumentNumber } from "@/api/citizen/document-number";
import { InfoCardType } from "@/types/InfoCard";
import toastMessage from "@/utils/common/toastMessage";

import { useState } from "react";

export const useFetchCitizenInfoPerInstitution = () => {
  const [loadingCitizen, setLoading] = useState(false);
  const [citizenData, setData] = useState<any>();

  const fetchCitizenData = async (identifier: string) => {
    setLoading(true);

    try {
      const data = await fetchApplicantByDocumentNumber(identifier);
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch citizen:", error);
      toastMessage("error", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    citizenData,
    loadingCitizen,
    fetchCitizenData,
  };
};
