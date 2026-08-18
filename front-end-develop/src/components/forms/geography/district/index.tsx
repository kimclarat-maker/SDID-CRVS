import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import SelectDropdown from "@/components/select";
import Button from "@/components/button";
import { listProvinces } from "@/utils/rwanda";
import formatSelectData from "@/utils/common/formatSelectData";
import { Districts } from "rwanda";
import { Modal } from "rsuite";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import {
  useFetchDistricts,
  useFetchDistrictsByProvince,
} from "@/hooks/geography/useDistrict";
import Input from "@/components/input";
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

export default function DistrictForm({
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
    fetchProvinces();
  }, [values.countryId]);

  const fetchProvinces = (search?: string) => {
    if (values.countryId) {
      fetchProvincesData({
        offset: 0,
        limit: 10,
        search: search ? search : undefined,
        countryId: values.countryId.value,
      });
    }
  };

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
        reactSelect
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
        onSearch={fetchProvinces}
        loading={loadingProvinces}
        type="object"
        reactSelect
      />

      <Input
        name="Code"
        label={translation.code}
        placeholder={translation.code_placeholder}
        required
        value={values.code}
        onChange={(e) => setFieldValue("code", e)}
        error={errors.code}
        type="number"
      />

      <Input
        name="name"
        label={translation.district}
        placeholder={translation.name_placeholder}
        required
        value={values.name}
        onChange={(value) => setFieldValue("name", value)}
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
