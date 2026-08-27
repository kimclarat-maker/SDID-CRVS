import api from "@/api";
import Card from "@/components/card";
import Input from "@/components/input";
import Loading from "@/components/loader";
import SelectDropdown from "@/components/select";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchAccountById } from "@/hooks/useAccounts";
import { useFetchRole } from "@/hooks/useRole";
import toastMessage from "@/utils/common/toastMessage";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, ButtonToolbar, Panel, PanelGroup, Stack, Text } from "rsuite";
import { AccountType } from "@/types/Account";
import { useFetchCenters } from "@/hooks/useCenters";
import { useFetchDocumentTypes } from "@/hooks/useDocumentTypes";
import Button from "@/components/button";
import { accessRoleName, defineAccess } from "@/utils/common/permissions";
import { goBack } from "@/utils/common/goBack";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import { citizenships } from "@/constants/citizenship";
import capitalizeText from "@/utils/common/capitalizeText";
import AcountLogs from "./accLogs";
import { getStorage } from "@/utils/storage";
import { isDemoMode } from "@/demo/config";
import { demoSaveAccount, demoRemoveAccountCenter } from "@/demo/services/administration";
import { DemoRole } from "@/demo/types";

function Profile() {
  const { translation } = useContext(LanguageContext);
  const { accountId } = useParams();
  const [userLoggedIn, setUserLoggedIn] = useState<any>({});
  const { loading, fetchAccountData, data } = useFetchAccountById();
  const { roles, loadingRoles, fetchRolesData } = useFetchRole("dropdown");
  const { centers, loadingCenters, fetchCentersData } =
    useFetchCenters("dropdown");
  const { documentTypes, loadingDocumentTypes, fetchDocumentTypesData } =
    useFetchDocumentTypes("dropdown");
  const [isRemoving, setRemoveLoader] = useState(false);
  const navigate = useNavigate();

  const { countries, loadingCountries, fetchCountriesData } =
    useFetchCountries("dropdown");

  useEffect(() => {
    fetchCountriesData({ offset: 0, limit: 195 });
  }, []);

  const { provinces, loadingProvinces, fetchProvincesData } =
    useFetchProvinces("dropdown");
  const { districts, loadingDistricts, fetchDistrictsByProvinceData } =
    useFetchDistrictsByProvince("dropdown");
  const { sectors, loadingSectors, fetchSectorsByDistrictData } =
    useFetchSectorsByDistrict("dropdown");
  const { cells, loadingCells, fetchCellsBySectorData } =
    useFetchCellsBySector("dropdown");

  useEffect(() => {
    if (!accountId) return;
    fetchAccountData(accountId);
    fetchRolesData();
    fetchCentersData({
      offset: 0,
      limit: 50,
    });
  }, []);

  const validationSchema = Yup.object({
    accessRole: Yup.object()
      .required(translation.access_role_required)
      .typeError(translation.access_role_required),
  });

  useEffect(() => {
    const getUser = async () => {
      const user = await getStorage();
      setUserLoggedIn(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (data && data._id) {
      formik.setValues({
        center: data?.center
          ? {
              label: data?.center.name,
              value: data?.center._id,
            }
          : null,
        accessRole: data?.accessRole
          ? {
              label: data?.accessRole.name,
              value: data?.accessRole._id,
            }
          : null,

        documentType:
          data?.documentType?.map((el: any) => {
            return {
              label: el?.name,
              value: el?._id,
            };
          }) || null,
        password: "",
      });
    }
  }, [data]);

  const formik = useFormik<AccountType>({
    initialValues: {
      center: null,
      accessRole: "",
      documentType: [],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (isDemoMode()) {
          const res = await demoSaveAccount({
            _id: data._id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            role: (values.accessRole?.value as DemoRole) || (data.accessRole?._id as DemoRole),
            centerId: values?.center?.value || "",
            status: data.status,
          });
          onSuccess(res.data);
          return;
        }

        let method = "PATCH";
        let url = `/accounts/${data._id}`;
        let body = {
          centerId: values?.center?.value || "",
          accessRoleId: values.accessRole?.value,
          documentType: values?.documentType
            ? values?.documentType?.map((el: any) => el.value)
            : [],
        };

        // if (!body.centerId) {
        //   delete body.centerId;
        // }

        const options = {
          method,
          url,
          data: body,
        };

        const { data: res } = await api(options);
        onSuccess(res);
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
  });

  useEffect(() => {
    if (formik.values.citizenship) {
      fetchDocumentTypesData({
        offset: 0,
        limit: 50,
        citizenship: formik.values.citizenship?.value,
      });
    }
  }, [formik.values.citizenship]);

  useEffect(() => {
    if (formik.values.country) {
      fetchProvincesData({ countryId: formik.values.country.value });
    }
  }, [formik.values.country]);

  useEffect(() => {
    if (formik.values.province) {
      fetchDistrictsByProvinceData(formik.values.province.value);
    }
  }, [formik.values.province]);

  useEffect(() => {
    if (formik.values.district) {
      fetchSectorsByDistrictData(formik.values.district.value);
    }
  }, [formik.values.district]);

  useEffect(() => {
    if (formik.values.sector) {
      fetchCellsBySectorData(formik.values.sector.value);
    }
  }, [formik.values.sector]);

  const onRemoveCenter = async () => {
    try {
      if (data && data._id) {
        setRemoveLoader(true);

        if (isDemoMode()) {
          const res = await demoRemoveAccountCenter(data._id);
          onSuccess(res.data);
          return;
        }

        let body = {
          centerId: "",
        };

        const options = {
          method: "PATCH",
          url: `/accounts/${data._id}`,
          data: body,
        };

        const { data: res } = await api(options);

        onSuccess(res);
      }
    } catch (error: any) {
      toastMessage("error", error);

      setRemoveLoader(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [
    formik.values.country,
    formik.values.province,
    formik.values.district,
    formik.values.sector,
    formik.values.cell,
    formik.values.village,
  ]);

  const fetchCenters = (search?: string) => {
    if (!formik.values.country) return;
    if (
      formik.values.country?.label &&
      formik.values.province?.label &&
      formik.values.district?.label &&
      formik.values.sector?.label &&
      formik.values.cell?.label
    ) {
      fetchCentersData({
        offset: 0,
        limit: 10,
        country: formik.values?.country?.label,
        province: formik.values.province?.label,
        district: formik.values.district?.label,
        sector: formik.values.sector?.label,
        cell: formik.values.cell?.label,
        search: search ? search : undefined,
      });

      return;
    }
  };

  if (!accountId) return <center>{translation.no_data_found}</center>;
  if (loading) return <Loading isFullScreen />;
  if (!data._id) return <center>{translation.no_data_found}</center>;

  const roleName = accessRoleName();

  const onSuccess = (data: any) => {
    toastMessage("success", data.message);

    fetchAccountData(accountId);
    navigate("/dashboard/admin/accounts");
  };

  const canUpdateAccount = defineAccess({
    method: "update",
    module: "account",
  });

  return (
    <div className="row">
      <div className="col-md-8 mx-auto">
        <>
          <PanelGroup accordion>
            <Panel header={translation.basic_information} defaultExpanded>
              <Card>
                <div className="row">
                  <center className="mb-4">
                    <Avatar src={data.photo} size="xxl" />
                  </center>
                  <div>
                    <div className="row">
                      <div className="col-md-6">
                        <Input
                          name="firstName"
                          label={translation.first_name}
                          value={data.firstName}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <Input
                          name="lastName"
                          label={translation.last_name}
                          value={data.lastName}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <Input
                          name="email"
                          label={translation.email}
                          value={data.email}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <Input
                          name="phoneNumber"
                          label={translation.phone_number}
                          value={data.phoneNumber}
                          disabled
                        />
                      </div>
                      <div className="col-md-12">
                        <Input
                          name="idNumber"
                          label={translation.id_number}
                          value={data.idNumber}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Panel>
            <Panel header={translation.access_role_management} defaultExpanded>
              <Card>
                <div className={`col-md-12`}>
                  <SelectDropdown
                    options={roles}
                    name="accessRole"
                    label={translation.access_role}
                    placeholder={translation.select}
                    required
                    value={formik.values.accessRole}
                    onChange={(e) => formik.setFieldValue("accessRole", e)}
                    error={formik.errors.accessRole}
                    leftIcon="settings"
                    loading={loadingRoles}
                    type="object"
                    reactSelect
                  />
                </div>
              </Card>
            </Panel>
            <Panel defaultExpanded>
              <Card>
                <div className="row">
                  <div className={`col-md-12`}>
                    <SelectDropdown
                      options={citizenships(translation)}
                      name="citizenship"
                      label={translation.citizenship}
                      placeholder={translation.select}
                      required
                      value={formik.values.citizenship}
                      onChange={(e) => formik.setFieldValue("citizenship", e)}
                      error={formik.errors.citizenship}
                      leftIcon="flag"
                      reactSelect
                    />
                  </div>
                  <div className={`col-md-12`}>
                    <SelectDropdown
                      options={documentTypes?.map((el) => {
                        return {
                          ...el,
                          label: `${el.label}(${capitalizeText(
                            el.citizenship
                          )})`,
                        };
                      })}
                      name="documentType"
                      label={translation.document_type}
                      placeholder={translation.select}
                      value={formik.values.documentType}
                      onChange={(e) => formik.setFieldValue("documentType", e)}
                      error={formik.errors.documentType}
                      leftIcon="settings"
                      loading={loadingDocumentTypes}
                      type="object"
                      isMulti
                      reactSelect
                    />
                  </div>
                </div>
              </Card>
            </Panel>
            <Panel
              header={`${translation.center} ${
                formik.values.center?.value
                  ? "(" + formik.values.center?.label + ")"
                  : ""
              }`}
            >
              <Card>
                {formik.values.accessRole?.type !== "superAdmin" && (
                  <div className="row">
                    <div className="col-md-6">
                      <SelectDropdown
                        options={countries}
                        label={translation.country}
                        value={formik.values?.country}
                        onChange={(value) => {
                          formik.setFieldValue("country", value);
                        }}
                        error={formik.errors.country}
                        name="country"
                        loading={loadingCountries}
                        required
                        type="object"
                      />
                    </div>
                    <div className="col-md-6">
                      <SelectDropdown
                        options={provinces}
                        label={
                          formik.values?.country?.label &&
                          formik.values?.country?.label?.toUpperCase() ===
                            "RWANDA"
                            ? translation.province
                            : translation.type
                        }
                        value={formik.values.province}
                        onChange={(province) =>
                          formik.setFieldValue("province", province)
                        }
                        error={formik.errors.province}
                        name="province"
                        loading={loadingProvinces}
                        type="object"
                      />
                    </div>
                    <div className="col-md-6">
                      <SelectDropdown
                        options={districts}
                        label={
                          formik.values?.country?.label &&
                          formik.values?.country?.label?.toUpperCase() ===
                            "RWANDA"
                            ? translation.district
                            : translation.continent
                        }
                        value={formik.values.district}
                        error={formik.errors.district}
                        onChange={(district) =>
                          formik.setFieldValue("district", district)
                        }
                        name="district"
                        loading={loadingDistricts}
                        type="object"
                      />
                    </div>
                    <div className="col-md-6">
                      <SelectDropdown
                        options={sectors}
                        label={
                          formik.values?.country?.label &&
                          formik.values?.country?.label?.toUpperCase() ===
                            "RWANDA"
                            ? translation.sector
                            : translation.embassy
                        }
                        value={formik.values.sector}
                        error={formik.errors.sector}
                        onChange={(sector) =>
                          formik.setFieldValue("sector", sector)
                        }
                        name="sector"
                        loading={loadingSectors}
                        type="object"
                      />
                    </div>
                    <div className="col-md-6">
                      <SelectDropdown
                        options={cells}
                        label={
                          formik.values?.country?.label &&
                          formik.values?.country?.label?.toUpperCase() ===
                            "RWANDA"
                            ? translation.cell
                            : translation.city
                        }
                        value={formik.values.cell}
                        error={formik.errors.cell}
                        onChange={(cell) => formik.setFieldValue("cell", cell)}
                        name="cell"
                        loading={loadingCells}
                        type="object"
                      />
                    </div>
                    <div className="col-md-12">
                      <SelectDropdown
                        options={centers}
                        name="center"
                        label={translation.center}
                        placeholder={translation.select}
                        value={formik.values.center}
                        onChange={(e) => formik.setFieldValue("center", e)}
                        error={formik.errors.center}
                        leftIcon="villa"
                        loading={loadingCenters}
                        type="object"
                        onSearch={fetchCenters}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Panel>
          </PanelGroup>
          <div>
            <Stack spacing={16}>
              <Stack.Item grow={1}>
                {defineAccess({ method: "update", module: "account" }) &&
                  roleName?.toUpperCase() === "SUPERADMIN" &&
                  formik.values.isUpdateEnabled && (
                    <Button
                      text={translation.remove_center}
                      onClick={() => onRemoveCenter()}
                      appearance="ghost"
                      loading={isRemoving}
                    />
                  )}
              </Stack.Item>
              <Stack.Item grow={1}></Stack.Item>
              <Stack.Item>
                <ButtonToolbar style={{ marginTop: "1rem" }}>
                  <Button
                    text={translation.go_back}
                    onClick={() => goBack(navigate)}
                    appearance="default"
                  />
                  {canUpdateAccount &&
                    userLoggedIn?.account?._id !== data._id && (
                      <Button
                        text={translation.submit}
                        onClick={formik.handleSubmit}
                        loading={formik.isSubmitting}
                        disabled={!data}
                      />
                    )}
                </ButtonToolbar>
              </Stack.Item>
            </Stack>
          </div>
        </>
      </div>
      <div className="col-md-4">
        {/* <AcountLogs idNumber={data.idNumber} /> */}
      </div>
    </div>
  );
}

export default Profile;
