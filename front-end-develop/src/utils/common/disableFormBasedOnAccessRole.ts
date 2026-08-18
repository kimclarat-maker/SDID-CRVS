import { getStorage } from "../storage";

export const disableFormBasedOnAccessRole = async ({
  setFieldValue,
  setDisabledFields,
}: {
  setDisabledFields: any;
  setFieldValue: any;
}) => {
  const user = await getStorage();
  const { account } = user || {};
  const { accessRole, center } = account || {};
  const { value } = accessRole || {};
  const disabledFields: string[] = [];

  if (value === "provinceLevel") {
    disabledFields.push("residentialProvince");

    setFieldValue("residentialProvince", {
      ...center.provinceDetail,
      label: center.provinceDetail.name,
      value: center.provinceDetail.id,
    });
  }

  if (value === "districtLevel") {
    disabledFields.push("residentialDistrict", "residentialProvince");
    setFieldValue("residentialProvince", {
      ...center.provinceDetail,
      label: center.provinceDetail.name,
      value: center.provinceDetail.id,
    });
    setFieldValue("residentialDistrict", {
      ...center.districtDetail,
      label: center.districtDetail.name,
      value: center.districtDetail.id,
    });
  }

  if (value === "sectorLevel") {
    disabledFields.push(
      "residentialSector",
      "residentialProvince",
      "residentialDistrict"
    );
    setFieldValue("residentialProvince", {
      ...center.provinceDetail,
      label: center.provinceDetail.name,
      value: center.provinceDetail.id,
    });
    setFieldValue("residentialDistrict", {
      ...center.districtDetail,
      label: center.districtDetail.name,
      value: center.districtDetail.id,
    });
    setFieldValue("residentialSector", {
      ...center.sectorDetail,
      label: center.sectorDetail.name,
      value: center.sectorDetail.id,
    });
  }

  if (value === "cellLevel") {
    disabledFields.push(
      "residentialCell",
      "residentialProvince",
      "residentialDistrict",
      "residentialSector"
    );
    setFieldValue("residentialProvince", {
      ...center.provinceDetail,
      label: center.provinceDetail.name,
      value: center.provinceDetail.id,
    });
    setFieldValue("residentialDistrict", {
      ...center.districtDetail,
      label: center.districtDetail.name,
      value: center.districtDetail.id,
    });
    setFieldValue("residentialSector", {
      ...center.sectorDetail,
      label: center.sectorDetail.name,
      value: center.sectorDetail.id,
    });
    setFieldValue("residentialCell", {
      ...center.cellDetail,
      label: center.cellDetail.name,
      value: center.cellDetail.id,
    });
  }

  if (value === "villageLevel") {
    disabledFields.push(
      "residentialVillage",
      "residentialProvince",
      "residentialDistrict",
      "residentialSector",
      "residentialCell"
    );
    setFieldValue("residentialProvince", {
      ...center.provinceDetail,
      label: center.provinceDetail.name,
      value: center.provinceDetail.id,
    });
    setFieldValue("residentialDistrict", {
      ...center.districtDetail,
      label: center.districtDetail.name,
      value: center.districtDetail.id,
    });
    setFieldValue("residentialSector", {
      ...center.sectorDetail,
      label: center.sectorDetail.name,
      value: center.sectorDetail.id,
    });
    setFieldValue("residentialCell", {
      ...center.cellDetail,
      label: center.cellDetail.name,
      value: center.cellDetail.id,
    });
    setFieldValue("residentialVillage", {
      ...center.villageDetail,
      label: center.villageDetail.name,
      value: center.villageDetail.id,
    });
  }

  setDisabledFields(disabledFields);
};
