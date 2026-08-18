import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import Input from "@/components/input";
import SelectDropdown from "@/components/select";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchVillagesByCell } from "@/hooks/geography/useVillage";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import { CenterType } from "@/types/Center";
import { levels, types } from "@/constants/permissions";

type FormTypes = {
  errors: any;
  touched: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
  selectedData?: CenterType;
  setValues?: (data: any) => void;
};

export default function CenterForm({
  errors,
  touched,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const { countries, loadingCountries, fetchCountriesData } =
    useFetchCountries("dropdown");

  useEffect(() => {
    fetchCountriesData({
      offset: 0,
      limit: 1000,
      status: "active",
    });
  }, []);

  const { provinces, loadingProvinces, fetchProvincesData } =
    useFetchProvinces("dropdown");
  const { districts, loadingDistricts, fetchDistrictsByProvinceData } =
    useFetchDistrictsByProvince("dropdown");
  const { sectors, loadingSectors, fetchSectorsByDistrictData } =
    useFetchSectorsByDistrict("dropdown");
  const { cells, loadingCells, fetchCellsBySectorData } =
    useFetchCellsBySector("dropdown");
  const { villages, loadingVillages, fetchVillagesByCellData } =
    useFetchVillagesByCell("dropdown");

  useEffect(() => {
    for (let el of countries) {
      if (el.code === "RW") {
        setFieldValue("country", el);
      }
    }
  }, [countries]);

  useEffect(() => {
    if (values.country?.label) {
      setFieldValue("foreignAddress", null);

      fetchProvincesData({
        countryId: values.country?.value,
      });
    }
  }, [values.country]);

  useEffect(() => {
    if (values.province) {
      fetchDistrictsByProvinceData(values.province.value);
    }
  }, [values.province]);

  useEffect(() => {
    if (values.district) {
      fetchSectorsByDistrictData(values.district.value);
    }
  }, [values.district]);

  useEffect(() => {
    if (values.sector) {
      fetchCellsBySectorData(values.sector.value);
    }
  }, [values.sector]);

  useEffect(() => {
    if (values.cell) {
      fetchVillagesByCellData(values.cell.value);
    }
  }, [values.cell]);

  return (
    <div className="rs-modal-body">
      <div style={{ height: "70vh", overflowY: "auto", overflowX: "hidden" }}>
        <div className="row">
          <div className="col-md-12">
            <Input
              name="name"
              label={translation.name}
              placeholder={translation.name_placeholder}
              required
              value={values.name}
              onChange={(value) => setFieldValue("name", value)}
              error={touched.name && errors.name}
            />
          </div>

          <div className="col-md-12">
            <Input
              name="contactNumber"
              label={translation.contact_number}
              placeholder={translation.phone_number_placeholder}
              required
              value={values.contactNumber}
              onChange={(value) => setFieldValue("contactNumber", value)}
              error={touched.contactNumber && errors.contactNumber}
              withCountry
              onChangeCountry={(e) => setFieldValue("phoneCountry", e)}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Input
              name="availableOperators"
              label={translation.available_operators}
              placeholder={translation.available_operators}
              required
              value={values.availableOperators}
              onChange={(value) => setFieldValue("availableOperators", value)}
              error={touched.availableOperators && errors.availableOperators}
              type="number"
            />
          </div>

          <div className="col-md-6">
            <Input
              name="capacityPerSlotOperator"
              label={translation.capacity_per_slot_operator}
              placeholder={translation.capacity_per_slot_operator}
              required
              value={values.capacityPerSlotOperator}
              onChange={(value) =>
                setFieldValue("capacityPerSlotOperator", value)
              }
              error={
                touched.capacityPerSlotOperator &&
                errors.capacityPerSlotOperator
              }
              onChangeCountry={(e) =>
                setFieldValue("capacityPerSlotOperator", e)
              }
              type="number"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <Input
              name="latitude"
              label={translation.latitude}
              placeholder={translation.latitude}
              required
              value={values.latitude}
              onChange={(value) => setFieldValue("latitude", value)}
              error={touched.latitude && errors.latitude}
            />
          </div>
          <div className="col-md-6">
            <Input
              name="longitude"
              label={translation.longitude}
              placeholder={translation.longitude}
              required
              value={values.longitude}
              onChange={(value) => setFieldValue("longitude", value)}
              error={touched.longitude && errors.longitude}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <SelectDropdown
              options={levels}
              label={translation.level}
              value={values.level}
              onChange={(level) => setFieldValue("level", level)}
              error={touched.level && errors.level}
              name="level"
              type="object"
              reactSelect
            />
          </div>

          <div className="col-md-6">
            <SelectDropdown
              options={countries}
              label={translation.country}
              value={values?.country}
              onChange={(value) => {
                setFieldValue("country", value);
              }}
              error={touched.country && errors.country}
              name="country"
              loading={loadingCountries}
              required
              type="object"
              reactSelect
            />
          </div>
          {(values.level?.value === "provinceLevel" ||
            values.level?.value === "sectorLevel" ||
            values.level?.value === "cellLevel" ||
            values.level?.value === "villageLevel" ||
            values.level?.value === "districtLevel") && (
            <div className="col-md-6">
              <SelectDropdown
                options={provinces}
                label={translation.province}
                value={values.province}
                onChange={(province) => setFieldValue("province", province)}
                error={touched.province && errors.province}
                name="province"
                loading={loadingProvinces}
                type="object"
                reactSelect
              />
            </div>
          )}

          {(values.level?.value === "districtLevel" ||
            values.level?.value === "sectorLevel" ||
            values.level?.value === "cellLevel" ||
            values.level?.value === "villageLevel") && (
            <div className="col-md-6">
              <SelectDropdown
                options={districts}
                label={translation.district}
                value={values.district}
                error={touched.district && errors.district}
                onChange={(district) => setFieldValue("district", district)}
                name="district"
                loading={loadingDistricts}
                type="object"
                reactSelect
              />
            </div>
          )}

          {(values.level?.value === "sectorLevel" ||
            values.level?.value === "cellLevel" ||
            values.level?.value === "villageLevel") && (
            <div className="col-md-6">
              <SelectDropdown
                options={sectors}
                label={translation.sector}
                value={values.sector}
                error={touched.sector && errors.sector}
                onChange={(sector) => setFieldValue("sector", sector)}
                name="sector"
                loading={loadingSectors}
                type="object"
                reactSelect
              />
            </div>
          )}
          {values.level?.value === "cellLevel" && (
            <div className="col-md-6">
              <SelectDropdown
                options={cells}
                label={translation.cell}
                value={values.cell}
                error={touched.cell && errors.cell}
                onChange={(cell) => setFieldValue("cell", cell)}
                name="cell"
                loading={loadingCells}
                type="object"
                reactSelect
              />
            </div>
          )}
          {values.level?.value === "villageLevel" && (
            <div className="col-md-6">
              <SelectDropdown
                options={villages}
                label={translation.village}
                value={values.village}
                error={touched.village && errors.village}
                onChange={(village) => setFieldValue("village", village)}
                name="village"
                loading={loadingVillages}
                type="object"
                reactSelect
              />
            </div>
          )}

          <RadioGroup
            name={translation.status}
            error={touched.status && errors.status}
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
                <Radio
                  name={el.label}
                  label={el.label}
                  value={el.value}
                  key={i}
                />
              );
            })}
          </RadioGroup>
        </div>
      </div>
      <br />
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
