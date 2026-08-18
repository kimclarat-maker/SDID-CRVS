import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import Button from "@/components/button";
import { useFetchRole } from "@/hooks/useRole";
import { defineAccess } from "@/utils/common/permissions";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchVillagesByCell } from "@/hooks/geography/useVillage";

// Import smaller components
import { FilterInput } from "./filterInput";
import { FilterSelect } from "./filterSelect";
import { PersonalInfoFilters } from "./personalInfoFilters";
import { IdentityFilters } from "./identityFilters";
import { StatusFilters } from "./statusFilters";
import { DateFilters } from "./dateFilters";
import { AddressFilters } from "./addressFilters";
import { Heading, Panel, PanelGroup, Stack } from "rsuite";
import Icon from "@/components/icon";

// Constants
const preEnrollmentStatuses = [
  { label: "APPROVED", value: "APPROVED" },
  { label: "REJECTED", value: "REJECTED" },
  { label: "ROLLBACK", value: "ROLLBACK" },
];

const _enrollmentStatuses = [
  { label: "not_started", value: "not_started" },
  {
    label: "selfie_verification_pending",
    value: "selfie_verification_pending",
  },
  { label: "selfie_verified", value: "selfie_verified" },
  { label: "enrollment_started", value: "enrollment_started" },
  { label: "enrollment_completed", value: "enrollment_completed" },
  { label: "enrollment_failed", value: "enrollment_failed" },
];

// Types
interface ListType {
  label: string;
  value: string;
}

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  availableFilters: string[];
  searchPlaceholder?: string;
  searchLabel?: string;
  searchFiledName?: string;
  enrollmentStatuses?: ListType[];
  showSearchButton?: boolean;
  centerLevels?: ListType[];
  centerTypes?: ListType[];
  selfieVerificationSkipStatuses?: any;
  statuses?: any;
  permissions?: ListType[];
  searchTextUpperCase?: boolean;
  fields?: string[];
  bottomContent?: React.ReactNode;
  loading?: boolean;
};

export default function MainFilters({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  setFieldValue,
  availableFilters,
  searchPlaceholder,
  searchLabel,
  searchFiledName = "search",
  enrollmentStatuses = _enrollmentStatuses,
  centerTypes,
  centerLevels,
  selfieVerificationSkipStatuses,
  statuses,
  permissions,
  searchTextUpperCase,
  bottomContent,
  loading,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { roles, fetchRolesData } = useFetchRole("dropdown");

  // Geography hooks
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
  const [open, setOpen] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    fetchCountriesData();
  }, [open]);

  // Geography effects
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

  useEffect(() => {
    if (availableFilters.includes("roles")) {
      fetchRoles();
    }
  }, [availableFilters]);

  const fetchRoles = async (search?: string) => {
    await fetchRolesData({
      offset: 0,
      limit: 50,
      search,
    });
  };

  // Render functions for specific filters
  const renderSearch = () => (
    <FilterInput
      name={searchFiledName}
      label={searchLabel || ""}
      placeholder={searchPlaceholder || translation.search + "..."}
      value={values[searchFiledName || "search"]}
      onChange={(value) => setFieldValue(searchFiledName, value)}
      error={errors[searchFiledName]}
      testId={searchFiledName}
      searchTextUpperCase={searchTextUpperCase}
    />
  );

  const renderAccount = () => (
    <FilterInput
      name="account"
      label={translation.account}
      placeholder={translation.email_id_number_placeholder}
      value={values.account}
      onChange={(value) => setFieldValue("account", value)}
      error={errors.account}
      testId="account"
      type="async"
    />
  );

  const renderDeviceType = () => (
    <FilterSelect
      name="deviceType"
      label={translation.type}
      placeholder={translation.select}
      value={values.deviceType}
      onChange={(value) => setFieldValue("deviceType", value)}
      error={errors.deviceType}
      testId="deviceType"
      options={[
        { label: "Fingerprint", value: "FINGERPRINT" },
        { label: "Camera", value: "FACE" },
        { label: "Iris", value: "IRIS" },
        { label: "Signature", value: "SIGNATURE" },
        { label: "Laptop", value: "LAPTOP" },
      ]}
    />
  );

  const renderAssignmentStatus = () => (
    <FilterSelect
      name="assignmentStatus"
      label={translation.assignment_status}
      placeholder={translation.select}
      value={values.assignmentStatus}
      onChange={(value) => setFieldValue("assignmentStatus", value)}
      error={errors.assignmentStatus}
      testId="assignmentStatus"
      options={[
        { label: "ASSIGNED", value: "ASSIGNED" },
        { label: "UNASSIGNED", value: "UNASSIGNED" },
        { label: "TRANSFER_PENDING", value: "TRANSFER_PENDING" },
      ]}
    />
  );

  const renderAppointmentNo = () => (
    <FilterInput
      name="appointmentNo"
      label={translation.appointment_number}
      placeholder={translation.search}
      value={values.appointmentNo}
      onChange={(value) => setFieldValue("appointmentNo", value)}
      error={errors.appointmentNo}
      testId="appointmentNo"
    />
  );

  const renderRequestNo = () => (
    <FilterInput
      name="requestNo"
      label={translation.request_number}
      placeholder={translation.search}
      value={values.requestNo}
      onChange={(value) => setFieldValue("requestNo", value)}
      error={errors.requestNo}
      testId="requestNo"
    />
  );

  const renderRoles = () => {
    if (!availableFilters?.includes("roles")) return null;
    return (
      <FilterSelect
        name="role"
        label={translation.role}
        placeholder={translation.select}
        value={values.role}
        onChange={(value) => setFieldValue("role", value)}
        error={errors.role}
        testId="role"
        options={roles}
        type="object"
      />
    );
  };

  const renderCenterTypes = () => {
    if (!availableFilters?.includes("centerTypes")) return null;
    return (
      <FilterSelect
        name="centerType"
        label={translation.type}
        placeholder={translation.select}
        value={values.centerType}
        onChange={(value) => setFieldValue("centerType", value)}
        error={errors.centerType}
        testId="centerType"
        options={centerTypes || []}
      />
    );
  };

  const renderLevels = () => {
    if (!availableFilters?.includes("centerLevels")) return null;
    return (
      <FilterSelect
        name="centerLevel"
        label={translation.level}
        placeholder={translation.select}
        value={values.centerLevel}
        onChange={(value) => setFieldValue("centerLevel", value)}
        error={errors.centerLevel}
        testId="centerLevel"
        options={centerLevels || []}
      />
    );
  };

  const renderPermissions = () => (
    <FilterSelect
      name="value"
      label={translation.permission}
      placeholder={translation.select}
      value={values.value}
      onChange={(value) => setFieldValue("value", value)}
      error={errors.permissions}
      testId="value"
      options={permissions || []}
    />
  );

  return (
    <PanelGroup
      accordion
      activeKey={open}
      onSelect={(e) => setOpen(e === open ? null : e)}
      className="card filter-panel-group"
    >
      <Panel
        header={
          <Stack spacing={8}>
            <Icon name="tune" styles={{ fontSize: 18 }} />
            <Heading level={6}>{translation.filters}</Heading>
          </Stack>
        }
        eventKey={"1"}
      >
        <div className="row">
          {/* Search */}
          {(availableFilters?.includes(searchFiledName) ||
            availableFilters?.includes("search")) &&
            renderSearch()}

          {/* region Filters  */}
          {availableFilters.includes("region") && (
            <AddressFilters
              values={values}
              errors={errors}
              setFieldValue={setFieldValue}
              translation={translation}
              countries={countries}
              provinces={provinces}
              districts={districts}
              sectors={sectors}
              cells={cells}
              villages={villages}
              loadingCountries={loadingCountries}
              loadingProvinces={loadingProvinces}
              loadingDistricts={loadingDistricts}
              loadingSectors={loadingSectors}
              loadingCells={loadingCells}
              loadingVillages={loadingVillages}
            />
          )}

          {/* Identity Filters */}
          <IdentityFilters
            values={values}
            errors={errors}
            setFieldValue={setFieldValue}
            availableFilters={availableFilters}
            translation={translation}
            searchFiledName={searchFiledName}
          />

          {/* Personal Info Filters */}
          <PersonalInfoFilters
            values={values}
            errors={errors}
            setFieldValue={setFieldValue}
            availableFilters={availableFilters}
            translation={translation}
          />

          {/* Status Filters */}
          <StatusFilters
            values={values}
            errors={errors}
            setFieldValue={setFieldValue}
            availableFilters={availableFilters}
            translation={translation}
            enrollmentStatuses={enrollmentStatuses}
            preEnrollmentStatuses={preEnrollmentStatuses}
            selfieVerificationSkipStatuses={selfieVerificationSkipStatuses}
            statuses={statuses}
          />

          {/* Date Filters */}
          <DateFilters
            values={values}
            errors={errors}
            setFieldValue={setFieldValue}
            availableFilters={availableFilters}
            translation={translation}
          />

          {/* Other Filters */}
          {availableFilters.includes("roles") && renderRoles()}

          {availableFilters.includes("centerTypes") && renderCenterTypes()}

          {availableFilters.includes("centerLevels") && renderLevels()}

          {availableFilters.includes("appointmentNo") && renderAppointmentNo()}

          {availableFilters.includes("requestNo") && renderRequestNo()}

          {availableFilters.includes("deviceType") && renderDeviceType()}

          {availableFilters.includes("accountId") &&
            defineAccess({ method: "get", module: "account" }) &&
            renderAccount()}

          {availableFilters.includes("assignmentStatus") &&
            renderAssignmentStatus()}

          {availableFilters.includes("permission") && renderPermissions()}
        </div>

        {/* Search Button */}
        <div className="filter-panel-actions">
          <Button
            text={translation.search}
            onClick={handleSubmit}
            testId="submit-button"
            loading={isSubmitting}
          />
        </div>
      </Panel>
    </PanelGroup>
  );
}
