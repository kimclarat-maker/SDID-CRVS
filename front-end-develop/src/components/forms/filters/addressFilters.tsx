import { FilterSelect } from "./filterSelect";

interface AddressFiltersProps {
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any) => void;
  translation: any;
  countries: any[];
  provinces: any[];
  districts: any[];
  sectors: any[];
  cells: any[];
  villages: any[];
  loadingCountries: boolean;
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  loadingSectors: boolean;
  loadingCells: boolean;
  loadingVillages: boolean;
}

export const AddressFilters: React.FC<AddressFiltersProps> = ({
  values,
  errors,
  setFieldValue,
  translation,
  countries,
  provinces,
  districts,
  sectors,
  cells,
  villages,
  loadingCountries,
  loadingProvinces,
  loadingDistricts,
  loadingSectors,
  loadingCells,
  loadingVillages,
}) => {
  return (
    <>
      <FilterSelect
        value={values.country}
        name="country"
        options={countries}
        loading={loadingCountries}
        onChange={(e) => setFieldValue("country", e)}
        error={errors.country}
        label={translation.country}
        placeholder={translation.select}
        testId="country"
        type="object"
      />

      <FilterSelect
        value={values.province}
        name="province"
        options={provinces}
        loading={loadingProvinces}
        onChange={(e) => setFieldValue("province", e)}
        error={errors.province}
        label={translation.province}
        placeholder={translation.select}
        testId="province"
        type="object"
      />

      <FilterSelect
        value={values.district}
        name="district"
        options={districts}
        loading={loadingDistricts}
        onChange={(e) => setFieldValue("district", e)}
        error={errors.district}
        label={translation.district}
        placeholder={translation.select}
        testId="district"
        type="object"
      />

      <FilterSelect
        value={values.sector}
        name="sector"
        options={sectors}
        loading={loadingSectors}
        onChange={(e) => setFieldValue("sector", e)}
        error={errors.sector}
        label={translation.sector}
        placeholder={translation.select}
        testId="sector"
        type="object"
      />

      <FilterSelect
        value={values.cell}
        name="cell"
        options={cells}
        loading={loadingCells}
        onChange={(e) => setFieldValue("cell", e)}
        error={errors.cell}
        label={translation.cell}
        placeholder={translation.select}
        testId="cell"
        type="object"
      />

      <FilterSelect
        value={values.village}
        name="village"
        options={villages}
        loading={loadingVillages}
        onChange={(e) => setFieldValue("village", e)}
        error={errors.village}
        label={translation.village}
        placeholder={translation.select}
        testId="village"
        type="object"
      />
    </>
  );
};
