import { ChangeEvent, useContext } from "react";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import useDropdownData from "@/hooks/useDropdownData";
import SelectDropdown from ".";
import { LanguageContext } from "@/context/LanguageContext";

type FormTypes = {
  errors: any;
  values: any;
  setFieldValue: (field: string, value: any) => void;
  fieldName: string;
};

const CountryDropdown = ({
  values,
  setFieldValue,
  fieldName,
  errors,
}: FormTypes) => {
  const { translation } = useContext(LanguageContext);

  // Fetch countries using the custom hook
  const { options, loading, error } = useDropdownData({
    fetchFunction: useFetchCountries("dropdown").fetchCountriesData,
    initialParams: { offset: 0, limit: 195, status: "active" },
  });

  return (
    <SelectDropdown
      options={options} // Use the transformed options from useDropdownData
      name={fieldName}
      label={translation.country}
      placeholder={translation.country_placeholder}
      value={values.residentialCountry}
      onChange={(value) => {
        setFieldValue(fieldName, value);
      }}
      required
      error={errors.residentialCountry}
      testId="residentialCountry"
      leftIcon="flag"
      type="object"
      withTooltipLabel
      tooltipMessage={translation.country_of_resident_description}
      loading={loading} // Use the loading state from useDropdownData
    />
  );
};

export default CountryDropdown;
