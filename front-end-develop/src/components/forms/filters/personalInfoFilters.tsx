import { FilterInput } from "./filterInput";
import { FilterSelect } from "./filterSelect";

interface PersonalInfoFiltersProps {
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any) => void;
  availableFilters: string[];
  translation: any;
}

export const PersonalInfoFilters: React.FC<PersonalInfoFiltersProps> = ({
  values,
  errors,
  setFieldValue,
  availableFilters,
  translation,
}) => {
  if (
    !availableFilters.some((filter) =>
      [
        "firstName",
        "lastName",
        "fatherName",
        "motherName",
        "email",
        "phoneNumber",
      ].includes(filter)
    )
  ) {
    return null;
  }

  return (
    <>
      {availableFilters.includes("firstName") && (
        <FilterInput
          name="firstName"
          label={translation.surname}
          placeholder={translation.surname_placeholder}
          value={values.firstName}
          onChange={(value) => setFieldValue("firstName", value)}
          error={errors.firstName}
          testId="firstName"
          preventNumbers
        />
      )}

      {availableFilters.includes("lastName") && (
        <FilterInput
          name="lastName"
          label={translation.post_name}
          placeholder={translation.post_name_placeholder}
          value={values.lastName}
          onChange={(value) => setFieldValue("lastName", value)}
          error={errors.lastName}
          testId="lastName"
          preventNumbers
        />
      )}

      {availableFilters.includes("fatherName") && (
        <FilterInput
          name="fatherNames"
          label={translation.father_name}
          placeholder={translation.father_names_placeholder}
          value={values.fatherNames}
          onChange={(value) => setFieldValue("fatherNames", value)}
          error={errors.fatherNames}
          testId="fatherNames"
          preventNumbers
        />
      )}

      {availableFilters.includes("motherName") && (
        <FilterInput
          name="motherNames"
          label={translation.mother_name}
          placeholder={translation.mother_names_placeholder}
          value={values.motherNames}
          onChange={(value) => setFieldValue("motherNames", value)}
          error={errors.motherNames}
          testId="motherNames"
          preventNumbers
        />
      )}

      {availableFilters.includes("email") && (
        <FilterInput
          name="email"
          label={translation.email}
          placeholder={translation.email_address_placeholder}
          value={values.email}
          onChange={(value) => setFieldValue("email", value)}
          error={errors.email}
          testId="email"
        />
      )}

      {availableFilters.includes("phoneNumber") && (
        <FilterInput
          name="phoneNumber"
          label={translation.phone_number}
          placeholder={translation.phone_number_placeholder}
          value={values.phoneNumber}
          onChange={(value) => setFieldValue("phoneNumber", value)}
          error={errors.phoneNumber}
          testId="phoneNumber"
          type="number"
          maxLength={12}
        />
      )}
    </>
  );
};
