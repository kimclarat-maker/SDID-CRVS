export const showDescriptionOnInput = (translation: any, fieldName: string) => {
  if (fieldName === "spouseIDNumber") {
    return translation.spouse_id_number_description;
  }

  if (fieldName === "spouse") {
    return translation.spouse_name_description;
  }

  if (fieldName === "residentialCountry") {
    return translation.country_of_resident_description;
  }

  if (fieldName === "residentialProvince") {
    return translation.province_of_resident_description;
  }

  if (fieldName === "residentialDisctrict") {
    return translation.district_of_resident_description;
  }

  if (fieldName === "residentialProvince") {
    return translation.province_of_resident_description;
  }

  if (fieldName === "residentialSector") {
    return translation.sector_of_resident_description;
  }

  if (fieldName === "residentialCell") {
    return translation.cell_of_resident_description;
  }

  if (fieldName === "residentialVillage") {
    return translation.village_of_resident_description;
  }

  if (fieldName === "name") {
    return translation.name_description;
  }

  if (fieldName === "idNumber") {
    return translation.id_number_description;
  }

  if (fieldName === "firstName") {
    return translation.firstname_description;
  }

  if (fieldName === "lastName") {
    return translation.lastname_description;
  }
};
