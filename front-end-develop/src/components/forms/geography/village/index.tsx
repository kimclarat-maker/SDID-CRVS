import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect } from "react";
import SelectDropdown from "@/components/select";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import Input from "@/components/input";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchCountries } from "@/hooks/geography/useCountries";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function SectorForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { provinces, loadingProvinces, fetchProvincesData } =
    useFetchProvinces("dropdown");
  const { districts, loadingDistricts, fetchDistrictsByProvinceData } =
    useFetchDistrictsByProvince("dropdown");
  const { sectors, loadingSectors, fetchSectorsByDistrictData } =
    useFetchSectorsByDistrict("dropdown");

  const { cells, loadingCells, fetchCellsBySectorData } =
    useFetchCellsBySector("dropdown");

  const { loadingCountries, countries, fetchCountriesData } =
    useFetchCountries("dropdown");

  useEffect(() => {
    fetchCountriesData({
      offset: 0,
      limit: 1000,
      status: "active",
    });
  }, []);

  useEffect(() => {
    if (values.countryId) {
      fetchProvincesData({
        offset: 0,
        limit: 10,
        countryId: values.countryId.value,
      });
    }
  }, [values.countryId]);

  useEffect(() => {
    if (values.provinceId) {
      fetchDistrictsByProvinceData(values.provinceId.value);
    }
  }, [values.provinceId]);

  useEffect(() => {
    if (values.districtId) {
      fetchSectorsByDistrictData(values.districtId.value);
    }
  }, [values.districtId]);

  useEffect(() => {
    if (values.sectorId) {
      fetchCellsBySectorData(values.sectorId.value);
    }
  }, [values.sectorId]);

  return (
    <div className="formBody">
      <SelectDropdown
        options={countries}
        name="countryId"
        label={translation.country}
        placeholder={translation.select}
        required
        value={values.countryId}
        onChange={(value) => setFieldValue("countryId", value)}
        error={errors.countryId}
        loading={loadingCountries}
        type="object"
      />
      <SelectDropdown
        options={provinces}
        name="provinceId"
        label={translation.province}
        placeholder={translation.select}
        required
        value={values.provinceId}
        onChange={(e) => setFieldValue("provinceId", e)}
        error={errors.provinceId}
        loading={loadingProvinces}
        type="object"
      />

      <SelectDropdown
        options={districts}
        name="districtId"
        label={translation.district}
        placeholder={translation.select}
        required
        value={values.districtId}
        onChange={(e) => setFieldValue("districtId", e)}
        error={errors.districtId}
        loading={loadingDistricts}
        type="object"
      />

      <SelectDropdown
        options={sectors}
        name="sectorId"
        label={translation.sector}
        placeholder={translation.select}
        required
        value={values.sectorId}
        onChange={(e) => setFieldValue("sectorId", e)}
        error={errors.sectorId}
        loading={loadingSectors}
        type="object"
      />

      <SelectDropdown
        options={cells}
        name="cellId"
        label={translation.cell}
        placeholder={translation.select}
        required
        value={values.cellId}
        onChange={(e) => setFieldValue("cellId", e)}
        error={errors.cellId}
        loading={loadingCells}
        type="object"
      />

      <Input
        name="code"
        label={translation.code}
        placeholder={translation.code_placeholder}
        required
        value={values.code}
        onChange={(e) => setFieldValue("code", e)}
        error={errors.code}
      />

      <Input
        name="name"
        label={translation.village}
        placeholder={translation.village_placeholder}
        required
        value={values.name}
        onChange={(e) => setFieldValue("name", e)}
        error={errors.name}
      />

      <RadioGroup
        name={translation.status}
        error={errors.status}
        onChange={(status) => setFieldValue("status", status)}
        value={values.status}
        inline
      >
        {[
          {
            label: translation.active,
            value: "active",
          },
          {
            label: translation.inactive,
            value: "inactive",
          },
        ].map((el: any, i) => {
          return (
            <Radio name={el.label} label={el.label} value={el.value} key={i} />
          );
        })}
      </RadioGroup>

      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          appearance="default"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </div>
  );
}
