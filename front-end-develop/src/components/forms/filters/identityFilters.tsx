import { FilterInput } from "./filterInput";

interface IdentityFiltersProps {
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any) => void;
  availableFilters: string[];
  translation: any;
  searchFiledName?: string;
}

export const IdentityFilters: React.FC<IdentityFiltersProps> = ({
  values,
  errors,
  setFieldValue,
  availableFilters,
  translation,
  searchFiledName = "search",
}) => {
  if (
    !availableFilters.some((filter) =>
      ["identifier", "idNumber", "preEnrollmentNumber"].includes(filter)
    )
  ) {
    return null;
  }

  return (
    <>
      {availableFilters.includes("identifier") && (
        <FilterInput
          name="identifier"
          label={translation.identifier}
          placeholder={translation.identifier + "..."}
          value={values.identifier}
          onChange={(value) => setFieldValue("identifier", value)}
          error={errors.identifier}
          testId="identifier"
          type="number"
        />
      )}

      {availableFilters.includes("idNumber") && (
        <FilterInput
          name="idNumber"
          label={translation.id_number}
          placeholder={translation.id_number + "..."}
          value={values.idNumber}
          onChange={(value) => setFieldValue("idNumber", value)}
          error={errors.idNumber}
          testId="idNumber"
          type="number"
          maxLength={22}
        />
      )}

      {availableFilters.includes("preEnrollmentNumber") && (
        <FilterInput
          name="preEnrollmentNumber"
          label={translation.prenrollment_no}
          placeholder={translation.prenrollment_no_placeholder + "..."}
          value={values.preEnrollmentNumber}
          onChange={(value) => setFieldValue(searchFiledName, value)}
          error={errors.preEnrollmentNumber}
          testId={searchFiledName}
          maxLength={10}
        />
      )}
    </>
  );
};
