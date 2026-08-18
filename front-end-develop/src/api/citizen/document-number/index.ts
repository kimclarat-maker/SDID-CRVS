import api from "../..";

export const fetchApplicantByDocumentNumber = async (
  documentNumber: string
) => {
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
