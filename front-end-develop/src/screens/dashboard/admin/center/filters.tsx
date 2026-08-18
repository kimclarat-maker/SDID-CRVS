import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useMemo } from "react";
import { useFormik } from "formik";
import toastMessage from "@/utils/common/toastMessage";
import errors from "@/constants/errors";
import { searchValidationSchema } from "@/validation/filters.validation/filter.validation";
import MainFilters from "@/components/forms/filters/main";

interface FormType {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  country: string;
  search: string;
  centerType: string;
  centerLevel: string;
}

const Filters = ({
  filters,
  setFilters,
}: {
  filters: any;
  setFilters: (f: any) => void;
}) => {
  const { translation } = useContext(LanguageContext);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      province: filters?.province,
      district: filters?.district,
      sector: filters?.sector,
      cell: filters?.cell,
      village: filters?.village,
      country: filters?.country,
      search: filters?.search,
      centerType: filters?.centerType,
      centerLevel: filters?.centerLevel,
    },
    validationSchema,

    onSubmit: async (values) => {
      try {
        console.log("filters", filters);
        setFilters((prev: any) => ({
          ...prev,
          province: values?.province,
          district: values?.district,
          sector: values?.sector,
          cell: values?.cell,
          village: values?.village,
          country: values?.country,
          search: values?.search,
          centerType: values?.centerType,
          centerLevel: values?.centerLevel,
        }));
      } catch (error) {
        toastMessage("error", errors(translation.default, error)["002"]);
      }
    },
    enableReinitialize: true,
  });
  return (
    <MainFilters
      availableFilters={[
        "search",
        "country",
        "province",
        "district",
        "sector",
        "cell",
        "centerTypes",
        "centerLevels",
      ]}
      {...formik}
      searchFiledName="search"
      searchLabel={translation.search}
      centerLevels={[
        {
          label: translation.national_level,
          value: "nationalLevel",
        },
        {
          label: translation.province_level,
          value: "provinceLevel",
        },
        {
          label: translation.district_level,
          value: "districtLevel",
        },
        {
          label: translation.sector_level,
          value: "sectorLevel",
        },
        {
          label: translation.cell_level,
          value: "cellLevel",
        },
        {
          label: translation.village_level,
          value: "villageLevel",
        },
      ]}
      centerTypes={[
        {
          label: translation.enrollment,
          value: "enrollment",
        },
      ]}
      showSearchButton
    />
  );
};

export default Filters;
