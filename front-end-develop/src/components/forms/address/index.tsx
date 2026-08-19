import SelectDropdown from "@/components/select";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchVillagesByCell } from "@/hooks/geography/useVillage";
import React, { useCallback, useContext, useEffect } from "react";
import { Stack } from "rsuite";
import { platformConfig } from "@/config/platform.config";

// Underlying fields/routes stay province/district/sector/cell/village (real
// backend contract); only the labels below come from the deployment's
// administrativeAreaHierarchy so the UI can read as country-neutral.
const [provinceLevel, districtLevel, sectorLevel, cellLevel, villageLevel] =
  platformConfig.administrativeAreaHierarchy;

type FormTypes = {
  errors: any;
  values: any;
  setFieldValue: (field: string, v: any) => void;
  formik?: any;
  view?: string;
  disabled?: boolean;
  requiredFields?: string[];
};

const FormView: React.FC<{ view?: string; children: React.ReactNode }> = ({
  view,
  children,
}) => {
  if (view) {
    return <div className={`col-md-6`}>{children}</div>;
  } else {
    return <Stack.Item>{children}</Stack.Item>;
  }
};

const Address = ({
  errors,
  values,
  setFieldValue,
  disabled,
  view,
  requiredFields,
}: FormTypes) => {
  const { translation } = useContext(LanguageContext);
  const { countries, fetchCountriesData, loadingCountries } =
    useFetchCountries("dropdown");

  const { loadingProvinces, fetchProvincesData, provinces } =
    useFetchProvinces("dropdown");
  const { loadingDistricts, fetchDistrictsByProvinceData, districts } =
    useFetchDistrictsByProvince("dropdown");
  const { loadingSectors, fetchSectorsByDistrictData, sectors } =
    useFetchSectorsByDistrict("dropdown");
  const { loadingCells, fetchCellsBySectorData, cells } =
    useFetchCellsBySector("dropdown");
  const { loadingVillages, fetchVillagesByCellData, villages } =
    useFetchVillagesByCell("dropdown");

  useEffect(() => {
    fetchCountriesData();
  }, []);

  useEffect(() => {
    const setDefaultCountry = () => {
      // Only set default if no country is selected and countries are loaded
      if (countries.length > 0 && !values.country) {
        const configuredCountry = countries.find(
          (el: any) =>
            el.name?.toUpperCase() ===
            platformConfig.countryName?.toUpperCase()
        );

        // Fallback: use first country if the deployment's configured country isn't found
        const defaultCountry = configuredCountry || countries[0];

        if (defaultCountry) {
          setFieldValue("country", defaultCountry);
        }
      }
    };

    setDefaultCountry();
  }, [countries, values.country, setFieldValue]);

  useEffect(() => {
    if (!values.country) return;
    fetchProvincesData({ countryId: values?.country?._id });
  }, [values.country]);
  useEffect(() => {
    if (!values.province) return;
    fetchDistrictsByProvinceData(values?.province?.value);
  }, [values.province]);
  useEffect(() => {
    if (!values.district) return;
    fetchSectorsByDistrictData(values?.district?.value);
  }, [values.district]);
  useEffect(() => {
    if (!values.sector) return;
    fetchCellsBySectorData(values?.sector?.value);
  }, [values.sector]);
  useEffect(() => {
    if (!values.cell) return;

    fetchVillagesByCellData(values?.cell?.value);
  }, [values.cell]);

  return (
    <>
      <FormView view={view}>
        <SelectDropdown
          value={values.country}
          name="country"
          options={countries}
          loading={loadingCountries}
          onChange={(e) => setFieldValue("country", e)}
          error={errors.country}
          label={translation.country}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("country")}
        />
      </FormView>

      <FormView view={view}>
        <SelectDropdown
          value={values.province}
          name="province"
          options={provinces}
          loading={loadingProvinces}
          onChange={(e) => setFieldValue("province", e)}
          error={errors.province}
          label={provinceLevel?.label || translation.province}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("province")}
        />
      </FormView>
      <FormView view={view}>
        <SelectDropdown
          value={values.district}
          name="district"
          options={districts}
          loading={loadingDistricts}
          onChange={(e) => setFieldValue("district", e)}
          error={errors.district}
          label={districtLevel?.label || translation.district}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("district")}
        />
      </FormView>
      <FormView view={view}>
        <SelectDropdown
          value={values.sector}
          name="sector"
          options={sectors}
          loading={loadingSectors}
          onChange={(e) => setFieldValue("sector", e)}
          error={errors.sector}
          label={sectorLevel?.label || translation.sector}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("sector")}
        />
      </FormView>
      <FormView view={view}>
        <SelectDropdown
          value={values.cell}
          name="cell"
          options={cells}
          loading={loadingCells}
          onChange={(e) => setFieldValue("cell", e)}
          error={errors.cell}
          label={cellLevel?.label || translation.cell}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("cell")}
        />
      </FormView>
      <FormView view={view}>
        <SelectDropdown
          value={values.village}
          name="village"
          options={villages}
          loading={loadingVillages}
          onChange={(e) => setFieldValue("village", e)}
          error={errors.village}
          label={villageLevel?.label || translation.village}
          type="object"
          disabled={disabled}
          required={requiredFields?.includes("village")}
        />
      </FormView>
    </>
  );
};

export default Address;
