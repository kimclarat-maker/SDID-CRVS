import api from "../..";
import { isDemoMode } from "@/demo/config";
import { demoFetchApplicantByDocumentNumber } from "@/demo/services/applicants";

export const fetchApplicantByDocumentNumber = async (
  documentNumber: string
) => {
  if (isDemoMode()) return demoFetchApplicantByDocumentNumber(documentNumber);

  // "nida"/"nid" are legacy backend route segments, not display terms — kept for backend compatibility.
  let url = `/citizen-info/nida/nid/${documentNumber.replace(" ", "")}`;
  if (documentNumber?.length > 5 && documentNumber?.length < 16) {
    url = `/citizen-info/nida/application-number/${documentNumber.replace(
      " ",
      ""
    )}`;
  }
  try {
    const options = {
      method: "GET",
      url,
    };

    const { data } = await api(options);

    return data;
  } catch (error) {
    throw error;
  }
};
