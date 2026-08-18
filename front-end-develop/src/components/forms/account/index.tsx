import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { generateStrongPassword } from "@/utils/common/randomPassword";
import { ButtonToolbar, Modal as LibModal, Stack, Text } from "rsuite";
import SelectDropdown from "@/components/select";
import { useFetchCenters } from "@/hooks/useCenters";
import { useFetchRole } from "@/hooks/useRole";
import { AccountType } from "@/types/Account";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import { defineAccess } from "@/utils/common/permissions";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import userPhoto from "@/assets/userPhotoPlaceholder.png";
import Documents from "@/components/documents";
import { fetchAccounts } from "@/api/accounts";
import { isValidEmail } from "@/utils/common/validateEmail";
import { handlePaste } from "@/utils/removeSpaceOnPaste";
import { useFetchPrenrollmentByIdentifier } from "@/hooks/useFetchPrenrollment";

type SupportingDocumentType = {
  name: string;
  _id: string;
};

interface FormTypes {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
  selectedData?: AccountType;
  setFieldError: any;
  supportingDocuments: SupportingDocumentType[];
  isUploading: boolean;
  setSupportingDocuments: (e: any) => void;
}
export default function AccountForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
  selectedData,
  setFieldError,
  supportingDocuments,
  isUploading,
  setSupportingDocuments
}: FormTypes) {
  const { translation } = useContext(LanguageContext);
  const { roles, loadingRoles, fetchRolesData } = useFetchRole("dropdown");
  const { centers, loadingCenters, fetchCentersData } =
    useFetchCenters("dropdown");

  const { countries, loadingCountries, fetchCountriesData } =
    useFetchCountries("dropdown");

  const { provinces, loadingProvinces, fetchProvincesData } =
    useFetchProvinces("dropdown");
  const { districts, loadingDistricts, fetchDistrictsByProvinceData } =
    useFetchDistrictsByProvince("dropdown");
  const { sectors, loadingSectors, fetchSectorsByDistrictData } =
    useFetchSectorsByDistrict("dropdown");
  const { cells, loadingCells, fetchCellsBySectorData } =
    useFetchCellsBySector("dropdown");
  const {
    loading: loadingCitizen,
    data: citizenData,
    fetchPrenrollmentByIdentifierData
  } = useFetchPrenrollmentByIdentifier();

  useEffect(() => {
    fetchCountriesData({ offset: 0, limit: 195 });
  }, []);

  useEffect(() => {
    const rwanda = countries.find((el) => el.code === "RW");

    if (rwanda) {
      setFieldValue("country", {
        ...rwanda,
        label: rwanda.name,
        value: rwanda._id
      });
    }
  }, [countries]);

  useEffect(() => {
    handleGenerateRandomPassword();

    fetchRolesData({
      offset: 0,
      limit: 50
    });
  }, []);

  useEffect(() => {
    if (citizenData) {
    }
  }, [citizenData]);

  const handleFetchCitizenInfo = () => {
    if (values.idNumber >= 16) {
      fetchPrenrollmentByIdentifierData(values.idNumber);
    }
  };

  useEffect(() => {
    if (values.idNumber?.length >= 16) {
      handleFetchCitizenInfo();
    }
  }, [values.idNumber]);

  useEffect(() => {
    if (selectedData?._id) return;
    if (values?.idNumber?.length !== 16) return;

    const getAccount = async () => {
      const { data } = await fetchAccounts({
        idNumber: values.idNumber
      });

      if (data.data.length > 0) {
        setFieldError("idNumber", translation.account_exist);
      }
    };

    getAccount();
  }, [values.idNumber]);

  useEffect(() => {
    if (selectedData?._id) return;
    if (!isValidEmail(values.email)) return;

    const getAccount = async () => {
      const { data } = await fetchAccounts({
        email: values.email
      });

      if (data.data.length > 0) {
        setFieldError("email", translation.account_exist);
      }
    };

    getAccount();
  }, [values.email]);

  useEffect(() => {
    if (selectedData?._id) return;
    if (values.phoneNumber.length !== 9) return;

    const getAccount = async () => {
      const { data } = await fetchAccounts({
        phoneNumber: values.phoneNumber
      });

      if (data.data.length > 0) {
        setFieldError("phoneNumber", translation.account_exist);
      }
    };

    getAccount();
  }, [values.phoneNumber]);

  useEffect(() => {
    if (values.idNumber?.length >= 16) {
      setFieldValue("photo", citizenData?.selfie);
    }
  }, [citizenData]);

  useEffect(() => {
    if (citizenData && citizenData.firstName && citizenData.firstName !== "") {
      setFieldValue("firstName", citizenData.firstName);
      setFieldError("firstName", "");
    } else {
      setFieldValue("firstName", "");
    }
    if (citizenData && citizenData.lastName && citizenData.lastName !== "") {
      setFieldValue("lastName", citizenData.lastName);

      setFieldError("lastName", "");
    } else {
      setFieldValue("lastName", "");
    }
    if (citizenData && citizenData.email && citizenData.email !== "") {
      setFieldValue("email", citizenData.email);

      setFieldError("email", "");
    } else {
      setFieldValue("email", "");
    }
    if (
      citizenData &&
      citizenData.phoneNumber &&
      citizenData.phoneNumber !== ""
    ) {
      setFieldValue("phoneNumber", citizenData.phoneNumber);

      setFieldError("phoneNumber", "");
    } else {
      setFieldValue("phoneNumber", "");
    }
  }, [citizenData]);

  const handleGenerateRandomPassword = () => {
    const password = generateStrongPassword();

    setFieldValue("password", password);
  };

  const canCreateAccount = defineAccess({
    method: "post",
    module: "account"
  });

  const canUpdateAccount = defineAccess({
    method: "PATCH",
    module: "account"
  });

  const canDeleteAccount = defineAccess({
    method: "delete",
    module: "account"
  });

  useEffect(() => {
    if (values.country?.label) {
      fetchProvincesData({
        countryId: values.country?.value,
        offset: 0,
        limit: 500,
        status: "active"
      });
    }
  }, [values.country]);

  useEffect(() => {
    if (values.province) {
      fetchDistrictsByProvinceData(values.province.value);
    }
  }, [values.province]);

  useEffect(() => {
    if (values.district) {
      fetchSectorsByDistrictData(values.district.value);
    }
  }, [values.district]);

  useEffect(() => {
    if (values.sector) {
      fetchCellsBySectorData(values.sector.value);
    }
  }, [values.sector]);

  useEffect(() => {
    fetchCenters();
  }, [
    values?.accessRole?.level,
    values?.accessRole?.level,
    values?.country,
    values?.province,
    values?.district,
    values?.sector,
    values?.cell,
    values?.village
  ]);

  const fetchCenters = (search?: string) => {
    if (!values.country) return;

    if (values?.accessRole?.level === "superAdmin") {
      return fetchCentersData({
        offset: 0,
        limit: 100,
        country: values?.country?.label,
        search: search ? search : undefined
      });
    }

    if (values?.accessRole?.level) {
      if (
        ![
          "nationalLevel",
          "provinceLevel",
          "districtLevel",
          "sectorLevel",
          "cellLevel",
          "villageLevel",
          "superAdmin",
          "admin"
        ].includes(values?.accessRole?.level)
      )
        return;

      if (
        values?.accessRole?.level === "nationalLevel" ||
        (values?.accessRole?.level === "admin" && values?.country?.label)
      ) {
        fetchCentersData({
          offset: 0,
          limit: 10,
          country: values?.country?.label,
          search: search ? search : undefined,
          centerLevel: values?.accessRole?.level
        });
      }

      if (
        (values?.accessRole?.level === "provinceLevel" ||
          values?.accessRole?.level === "admin") &&
        values?.country?.label &&
        values?.province?.label
      ) {
        fetchCentersData({
          offset: 0,
          limit: 10,
          country: values?.country?.label,
          province: values.province?.label,
          search: search ? search : undefined,
          centerLevel:
            values?.accessRole?.level === "admin"
              ? undefined
              : values?.accessRole?.level
        });
      }

      if (
        (values?.accessRole?.level === "districtLevel" ||
          values?.accessRole?.level === "admin") &&
        values?.country?.label &&
        values?.province?.label &&
        values?.district?.label
      ) {
        fetchCentersData({
          offset: 0,
          limit: 10,
          country: values?.country?.label,
          province: values.province?.label,
          district: values.district?.label,
          search: search ? search : undefined,
          centerLevel:
            values?.accessRole?.level === "admin"
              ? undefined
              : values?.accessRole?.level
        });
      }

      if (
        (values?.accessRole?.level === "sectorLevel" ||
          values?.accessRole?.level === "admin") &&
        values?.country?.label &&
        values?.province?.label &&
        values?.district?.label &&
        values?.sector?.label
      ) {
        fetchCentersData({
          offset: 0,
          limit: 50,
          country: values?.country?.label,
          province: values.province?.label,
          district: values.district?.label,
          sector: values.sector?.label,
          search: search ? search : undefined,
          centerLevel:
            values?.accessRole?.level === "admin"
              ? undefined
              : values?.accessRole?.level
        });
      }

      if (
        (values?.accessRole?.level === "cellLevel" ||
          values?.accessRole?.level === "admin") &&
        values?.country?.label &&
        values?.province?.label &&
        values?.district?.label &&
        values?.sector?.label &&
        values?.cell?.label
      ) {
        fetchCentersData({
          offset: 0,
          limit: 10,
          country: values?.country?.code,
          province: values.province?.code,
          district: values.district?.code,
          sector: values.sector?.code,
          cell: values.cell?.code,
          search: search ? search : undefined,
          centerLevel:
            values?.accessRole?.level === "admin"
              ? undefined
              : values?.accessRole?.level
        });
      }
    }
  };
  const renderBasicInformation = () => {
    return (
      <>
        <>
          {values.email !== "sdid.admin@huzalabs.com" && (
            <div className="col-md-12">
              <Input
                name="idNumber"
                label={translation.id_number}
                placeholder={translation.enter_id_number}
                required
                value={values.idNumber}
                onChange={(value) => setFieldValue("idNumber", value)}
                error={errors.idNumber}
                leftIcon="badge"
                loading={loadingCitizen}
                type="number"
                onPaste={(e) => handlePaste(e, "idNumber", setFieldValue)}
                rightContent={
                  !loadingCitizen && (
                    <Button
                      text={translation.search}
                      size="xs"
                      onClick={handleFetchCitizenInfo}
                    />
                  )
                }
                disabled={!canCreateAccount}
              />
            </div>
          )}
          {
            <>
              <div className="col-md-6">
                <Input
                  name="firstName"
                  label={translation.first_name}
                  placeholder={translation.first_name_placeholder}
                  required
                  value={values.firstName}
                  onChange={(value) => setFieldValue("firstName", value)}
                  error={errors.firstName}
                  disabled
                />
              </div>
              <div className="col-md-6">
                <Input
                  name="lastName"
                  label={translation.last_name}
                  placeholder={translation.last_name_placeholder}
                  required
                  value={values.lastName}
                  onChange={(value) => setFieldValue("lastName", value)}
                  error={errors.lastName}
                  disabled
                />
              </div>
            </>
          }
        </>

        <>
          <div className="col-md-6">
            <Input
              name="email"
              label={translation.email_address}
              placeholder={translation.email_address_placeholder}
              required
              value={values.email?.toLowerCase()}
              onChange={(value) => setFieldValue("email", value)}
              error={errors.email}
              disabled={!canCreateAccount}
            />
          </div>
          <div className="col-md-6">
            <Input
              name="phoneNumber"
              label={translation.phone_number}
              placeholder={translation.select}
              required
              value={values.phoneNumber}
              onChange={(value: any) => setFieldValue("phoneNumber", value)}
              error={errors.phoneNumber}
              disabled={!values.idNumber && !canCreateAccount}
            />
          </div>
        </>
      </>
    );
  };

  const renderAccessRole = () => {
    return (
      <>
        <div className={`col-md-12`}>
          <SelectDropdown
            options={roles}
            name="accessRole"
            label={translation.access_role}
            placeholder={translation.select}
            required
            value={values.accessRole}
            onChange={(e) => setFieldValue("accessRole", e)}
            error={errors.accessRole}
            loading={loadingRoles}
            type="object"
            disabled={!canCreateAccount}
          />
        </div>
      </>
    );
  };

  const renderCenter = () => {
    return (
      <>
        {values.accessRole?.type !== "superAdmin" && (
          <>
            <div className="col-md-4">
              <SelectDropdown
                options={countries}
                label={translation.country}
                value={values?.country}
                onChange={(value) => {
                  setFieldValue("country", value);
                }}
                error={errors.country}
                name="country"
                loading={loadingCountries}
                type="object"
                disabled={!canCreateAccount}
              />
            </div>
            {(values?.accessRole?.level === "admin" ||
              values?.accessRole?.level === "provinceLevel" ||
              values?.accessRole?.level === "districtLevel" ||
              values?.accessRole?.level === "sectorLevel" ||
              values?.accessRole?.level === "cellLevel") && (
              <div className="col-md-4">
                <SelectDropdown
                  options={provinces}
                  label={
                    values?.country?.label &&
                    values?.country?.label?.toUpperCase() === "RWANDA"
                      ? translation.province
                      : translation.type
                  }
                  value={values.province}
                  onChange={(province) => setFieldValue("province", province)}
                  error={errors.province}
                  name="province"
                  loading={loadingProvinces}
                  type="object"
                  disabled={!canCreateAccount}
                />
              </div>
            )}

            {(values?.accessRole?.level === "admin" ||
              values?.accessRole?.level === "districtLevel" ||
              values?.accessRole?.level === "sectorLevel" ||
              values?.accessRole?.level === "cellLevel") && (
              <div className="col-md-4">
                <SelectDropdown
                  options={districts}
                  label={
                    values?.country?.label &&
                    values?.country?.label?.toUpperCase() === "RWANDA"
                      ? translation.district
                      : translation.continent
                  }
                  value={values.district}
                  error={errors.district}
                  onChange={(district) => setFieldValue("district", district)}
                  name="district"
                  loading={loadingDistricts}
                  type="object"
                  disabled={!canCreateAccount}
                />
              </div>
            )}

            {(values?.accessRole?.level === "admin" ||
              values?.accessRole?.level === "sectorLevel" ||
              values?.accessRole?.level === "cellLevel") && (
              <div className="col-md-4">
                <SelectDropdown
                  options={sectors}
                  label={
                    values?.country?.label &&
                    values?.country?.label?.toUpperCase() === "RWANDA"
                      ? translation.sector
                      : translation.embassy
                  }
                  value={values.sector}
                  error={errors.sector}
                  onChange={(sector) => setFieldValue("sector", sector)}
                  name="sector"
                  loading={loadingSectors}
                  type="object"
                  disabled={!canCreateAccount}
                />
              </div>
            )}

            {(values?.accessRole?.level === "admin" ||
              values?.accessRole?.level === "cellLevel") && (
              <div className="col-md-4">
                <SelectDropdown
                  options={cells}
                  label={
                    values?.country?.label &&
                    values?.country?.label?.toUpperCase() === "RWANDA"
                      ? translation.cell
                      : translation.city
                  }
                  value={values.cell}
                  error={errors.cell}
                  onChange={(cell) => setFieldValue("cell", cell)}
                  name="cell"
                  loading={loadingCells}
                  type="object"
                  disabled={!canCreateAccount}
                />
              </div>
            )}

            <div className="col-md-12">
              <SelectDropdown
                options={centers}
                name="center"
                label={translation.center}
                placeholder={translation.select}
                value={values.center}
                onChange={(e) => setFieldValue("center", e)}
                error={errors.center}
                loading={loadingCenters}
                type="object"
                reactSelect
                disabled={!canCreateAccount}
              />
            </div>
          </>
        )}
      </>
    );
  };

  const renderSupportingDocument = () => {
    return (
      <>
        <div className="col-md-12">
          <Input
            type="file"
            name="newSupportingDocument"
            label={translation.supporting_document}
            value={values.newSupportingDocument}
            onChange={(event) => {
              setFieldValue(
                "newSupportingDocument",
                event.currentTarget.files[0]
              );
            }}
            error={errors.supportingDocument}
            accept=".pdf, .png, .jpeg"
            loading={isUploading}
          />
        </div>
      </>
    );
  };

  const renderStatus = () => {
    return (
      <>
        {selectedData && selectedData._id && (
          <div className="col-md-6">
            <RadioGroup
              name="status"
              label={translation.status}
              error={errors.status}
              onChange={(status) => setFieldValue("status", status)}
              value={values.status}
              inline
            >
              {[
                {
                  label: translation.active,
                  value: "active"
                },
                {
                  label: translation.inactive,
                  value: "inactive"
                }
              ].map((el: any, i) => {
                return (
                  <Radio
                    name={el.label}
                    label={el.label}
                    value={el.value}
                    key={i}
                  />
                );
              })}
            </RadioGroup>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="card-body rs-modal-body">
        <div className="row">
          <div className="col-md-4">
            <div className="user-img">
              <img src={citizenData?.selfie || userPhoto} />
            </div>
          </div>
          <div
            className="col-md-8"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <div className="row">
              {renderBasicInformation()}
              {renderAccessRole()}
              {renderCenter()}

              {selectedData?._id &&
                (!canCreateAccount || !canUpdateAccount) &&
                renderSupportingDocument()}
              {supportingDocuments?.length > 0 && (
                <>
                  <Text className="textPrimary">
                    {translation.supporting_documents}
                  </Text>
                  <br />
                  <Documents
                    data={supportingDocuments}
                    referenceType="ACCOUNT"
                    showDelete
                    referenceId={selectedData?._id}
                    setFiles={setSupportingDocuments}
                  />
                  <br />
                </>
              )}
              {renderStatus()}
            </div>
          </div>
        </div>
      </div>

      <LibModal.Footer>
        <Stack>
          <Stack.Item>
            <Button
              text={translation.cancel}
              onClick={() => (handleClose ? handleClose() : null)}
              appearance="default"
            />
          </Stack.Item>
          <Stack.Item grow={1}></Stack.Item>
          <Stack.Item>
            <ButtonToolbar>
              {canCreateAccount && (
                <Button
                  text={translation.submit}
                  onClick={() => handleSubmit()}
                  loading={isSubmitting}
                  disabled={!citizenData || Object.keys(errors).length > 0}
                />
              )}
            </ButtonToolbar>
          </Stack.Item>
        </Stack>
      </LibModal.Footer>
    </>
  );
}
