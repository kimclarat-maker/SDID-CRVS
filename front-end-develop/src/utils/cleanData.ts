import { InfoCardType } from "@/types/InfoCard";
import normalizeDate from "./common/date/normalizeDate";

export const formatCitizenData = (
  originalData: InfoCardType,
  updatedData?: InfoCardType
) => {
  let cleanedData: any = {};
  let exceptionList = [
    "applicantCategoryDetail",
    "documentTypeDetail",
    "maskedPhoneNumbers",
    "preHistoricalInfo",
  ];

  if (updatedData) {
    Object.keys(updatedData || {}).map((field) => {
      if (
        originalData[field] !== updatedData[field] &&
        !exceptionList.includes(field) &&
        updatedData[field] !== ""
      ) {
        cleanedData[field] = updatedData[field];
      }
      if (!originalData[field] && updatedData[field]) {
        cleanedData[field] = updatedData[field];
      }
    });
  }

  delete cleanedData["step"];
  delete cleanedData["residentialCountryName"];
  delete cleanedData["residentialProvinceName"];
  delete cleanedData["residentialDistrictName"];
  delete cleanedData["residentialSectorName"];
  delete cleanedData["residentialCellName"];
  delete cleanedData["residentialVillageName"];

  if (cleanedData?.supportingDocuments?.length === 0) {
    delete cleanedData.supportingDocuments;
  }

  if (cleanedData.legalGuardianDocumentTypeDetail) {
    delete cleanedData.legalGuardianDocumentTypeDetail;
  }

  if (cleanedData?.residentialCountry?.name) {
    cleanedData.residentialCountryCode = cleanedData?.residentialCountry?.code;
    delete cleanedData.residentialCountry;
  }

  if (cleanedData?.residentialProvince?.code) {
    cleanedData.residentialProvinceCode =
      cleanedData?.residentialProvince?.code;
    delete cleanedData.residentialProvince;
  }

  if (cleanedData?.residentialDistrict?.code) {
    cleanedData.residentialDistrictCode =
      cleanedData?.residentialDistrict?.code;
    delete cleanedData.residentialDistrict;
  }

  if (cleanedData?.residentialSector?.code) {
    cleanedData.residentialSectorCode = cleanedData?.residentialSector?.code;
    delete cleanedData.residentialSector;
  }

  if (cleanedData?.residentialCell?.code) {
    cleanedData.residentialCellCode = cleanedData?.residentialCell?.code;
    delete cleanedData.residentialCell;
  }

  if (cleanedData?.residentialVillage?.code) {
    cleanedData.residentialVillageCode = cleanedData?.residentialVillage?.code;
    delete cleanedData.residentialVillage;
  }

  if (cleanedData?.typeOfRwandanNationality?.value) {
    cleanedData.typeOfRwandanNationality =
      cleanedData.typeOfRwandanNationality.value;
  } else {
    cleanedData.typeOfRwandanNationality = cleanedData.typeOfRwandanNationality;
  }

  if (cleanedData.dob && cleanedData.dob !== "") {
    cleanedData.dob = normalizeDate(cleanedData.dob);
  }

  delete cleanedData.nlaAddress;

  return cleanedData;
};
