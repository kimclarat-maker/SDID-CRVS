import moment from "moment";

export const formatRequest = (params: any) => {
  if (!params) return {};

  const sessionOldInfo = sessionStorage.getItem("oldApplicantInformation");
  const parsedOldInfo = sessionOldInfo ? JSON.parse(sessionOldInfo) : {};

  if (params.type !== "CHILD") {
    // Remove fields if their value matches the parsedOldInfo
    Object.keys(params).forEach((key) => {
      if (
        parsedOldInfo[key] !== undefined && // Field exists in parsedOldInfo
        parsedOldInfo[key] === params[key] // Field value matches
      ) {
        delete params[key];
      }

      if (
        parsedOldInfo["dob"] !== params["dob"] &&
        moment(parsedOldInfo["dob"]).format("YYYY-MM-DD") ===
          moment(params["dob"]).format("YYYY-MM-DD")
      ) {
        delete params["dob"];
      }
    });
  }

  // Handle special cases for empty fields
  if (params.fatherIDNumber === "") {
    params.fatherIDNumber = undefined;
  }

  if (params.motherIDNumber === "") {
    params.motherIDNumber = undefined;
  }

  if (params.fatherNames === "") {
    params.fatherNames = undefined;
  }

  if (params.motherNames === "") {
    params.motherNames = undefined;
  }

  if (params.spouseIDNumber === "") {
    params.spouseIDNumber = undefined;
  }

  if (params.province) {
    delete params.province;
  }

  if (params.district) {
    delete params.district;
  }

  if (params.sector) {
    delete params.sector;
  }

  if (params.cell) {
    delete params.cell;
  }

  if (params.village) {
    delete params.village;
  }

  if (
    params?.maritalStatus?.toUpperCase() === "SINGLE" &&
    (params.spouse !== "" || params.spouseIDNumber !== "")
  ) {
    delete params.spouse;
    delete params.spouseIDNumber;
  }

  if (params.dob && params.dob !== "") {
    params.dob = formatDate(params.dob);
  }

  delete params.motherIdNumber;
  delete params.fatherIdNumber;
  delete params.parent;

  if (params.email === "") {
    delete params.email;
  }
  return {
    ...params,
  };
};

function formatDate(dateString: string) {
  if (dateString.includes("/")) {
    const [day, month, year] = dateString.split("/"); // Split based on the slash
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`; // Format to YYYY-MM-DD

    console.log("formattedDate", formattedDate);

    const date = new Date(formattedDate);

    console.log("date", date);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return formattedDate; // Return in YYYY-MM-DD format
  } else {
    return moment(dateString).format("YYYY-MM-DD");
  }
}
