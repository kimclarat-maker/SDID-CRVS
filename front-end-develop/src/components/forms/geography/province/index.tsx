import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect } from "react";
import Input from "@/components/input";
import SelectDropdown from "@/components/select";
import Button from "@/components/button";
import { Modal } from "rsuite";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
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

export default function ProvinceForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { loadingCountries, countries, fetchCountriesData } =
    useFetchCountries("dropdown");

  useEffect(() => {
    fetchCountriesData({
      offset: 0,
      limit: 1000,
      status: "active",
    });
  }, []);

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
        name="provinceName"
        label={translation.name}
        placeholder={translation.name_placeholder}
        required
        value={values.provinceName}
        onChange={(e) => setFieldValue("provinceName", e)}
        error={errors.provinceName}
      />
      <RadioGroup
        name="status"
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
            <Radio name="status" label={el.label} value={el.value} key={i} />
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
