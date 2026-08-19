import { fetchApplicantPhoneNumbers } from "@/api/citizen/document-number/phone-numbers";
import toastMessage from "@/utils/common/toastMessage";

import { useState } from "react";

export const useFetchCitizenPhoneNumbers = (type?: string) => {
  const [loadingCitizenPhoneNumbers, setLoading] = useState(false);
  const [citizenPhoneNumbers, setData] = useState<string[]>();

  const fetchCitizenPhoneNumbers = async (identifier: string) => {
    setLoading(true);

    try {
      const data = await fetchApplicantPhoneNumbers(identifier);

      if (type === "dropdown") {
        const formatData = data.map((el: any) => {
          return {
            label: el,
            value: el,
          };
        });

        console.log("formatData", formatData);

        setData(formatData);
        setLoading(false);

        return;
      }

      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch citizen phone numbers:", error);
      toastMessage("error", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    citizenPhoneNumbers,
    loadingCitizenPhoneNumbers,
    fetchCitizenPhoneNumbers,
  };
};
