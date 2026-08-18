import { FilterSelect } from "./filterSelect";

interface ListType {
  label: string;
  value: string;
}

interface StatusFiltersProps {
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any) => void;
  availableFilters: string[];
  translation: any;
  enrollmentStatuses?: ListType[];
  preEnrollmentStatuses?: ListType[];
  selfieVerificationSkipStatuses?: ListType[];
  statuses?: ListType[];
}

export const StatusFilters: React.FC<StatusFiltersProps> = ({
  values,
  errors,
  setFieldValue,
  availableFilters,
  translation,
  enrollmentStatuses = [],
  preEnrollmentStatuses = [],
  selfieVerificationSkipStatuses = [],
  statuses = [],
}) => {
  if (
    !availableFilters.some((filter) =>
      [
        "preEnrollmentStatus",
        "enrollmentStatus",
        "selfieVerificationSkipStatus",
        "approverSelfieSkipStatuses",
        "status",
      ].includes(filter)
    )
  ) {
    return null;
  }

  return (
    <>
      {availableFilters.includes("preEnrollmentStatus") && (
        <FilterSelect
          name="preEnrollmentStatus"
          label={translation.pre_enrollment_status}
          placeholder={translation.select}
          value={values.preEnrollmentStatus}
          onChange={(value) => setFieldValue("preEnrollmentStatus", value)}
          error={errors.preEnrollmentStatus}
          testId="preEnrollmentStatus"
          options={preEnrollmentStatuses}
        />
      )}

      {availableFilters.includes("enrollmentStatus") && (
        <FilterSelect
          name="enrollmentStatus"
          label={translation.enrollment_status}
          placeholder={translation.select}
          value={values.enrollmentStatus}
          onChange={(value) => setFieldValue("enrollmentStatus", value)}
          error={errors.enrollmentStatus}
          testId="enrollmentStatus"
          options={enrollmentStatuses}
        />
      )}

      {availableFilters.includes("selfieVerificationSkipStatus") && (
        <FilterSelect
          name="selfieVerificationSkipStatus"
          label={translation.status}
          placeholder={translation.select}
          value={values.selfieVerificationSkipStatus}
          onChange={(value) =>
            setFieldValue("selfieVerificationSkipStatus", value)
          }
          error={errors.selfieVerificationSkipStatus}
          testId="selfieVerificationSkipStatus"
          options={selfieVerificationSkipStatuses}
        />
      )}

      {availableFilters.includes("approverSelfieSkipStatuses") && (
        <FilterSelect
          name="approverSelfieSkipStatus"
          label={translation.status}
          placeholder={translation.select}
          value={values.approverSelfieSkipStatus}
          onChange={(value) => setFieldValue("approverSelfieSkipStatus", value)}
          error={errors.approverSelfieSkipStatus}
          testId="approverSelfieSkipStatus"
          options={statuses}
        />
      )}

      {availableFilters.includes("status") && (
        <FilterSelect
          name="status"
          label={translation.status}
          placeholder={translation.select}
          value={values.status}
          onChange={(value) => setFieldValue("status", value)}
          error={errors.status}
          testId="status"
          options={statuses}
        />
      )}
    </>
  );
};
