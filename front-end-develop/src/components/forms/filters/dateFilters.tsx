import { FilterInput } from "./filterInput";

interface DateFiltersProps {
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any) => void;
  availableFilters: string[];
  translation: any;
}

export const DateFilters: React.FC<DateFiltersProps> = ({
  values,
  errors,
  setFieldValue,
  availableFilters,
  translation,
}) => {
  if (
    !availableFilters.some((filter) =>
      ["startDate", "endDate", "date"].includes(filter)
    )
  ) {
    return null;
  }

  return (
    <>
      {(availableFilters.includes("startDate") ||
        availableFilters.includes("date")) && (
        <FilterInput
          name="startDate"
          label={translation.start_date}
          value={values.startDate}
          onChange={(value) => setFieldValue("startDate", value)}
          error={errors.startDate}
          testId="startDate"
          type="datetime-local"
          placeholder=""
        />
      )}

      {(availableFilters.includes("endDate") ||
        availableFilters.includes("date")) && (
        <FilterInput
          name="endDate"
          label={translation.end_date}
          value={values.endDate}
          onChange={(value) => setFieldValue("endDate", value)}
          error={errors.endDate || errors.password}
          testId="endDate"
          type="datetime-local"
          placeholder=""
        />
      )}
    </>
  );
};
