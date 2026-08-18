import { useFetchCenters } from "@/hooks/useCenters";
import { AccountType } from "@/types/Account";
import { useContext, useEffect, useState } from "react";
import toastMessage from "@/utils/common/toastMessage";
import { useFormik } from "formik";
import * as Yup from "yup";
import { LanguageContext } from "@/context/LanguageContext";
import api from "@/api";
import { useFetchDistrictsByProvince } from "@/hooks/geography/useDistrict";
import { useFetchProvinces } from "@/hooks/geography/useProvince";
import { useFetchSectorsByDistrict } from "@/hooks/geography/useSector";
import { useFetchCellsBySector } from "@/hooks/geography/useCell";
import { defineAccess } from "@/utils/common/permissions";
import SelectDropdown from "@/components/select";
import { useFetchCountries } from "@/hooks/geography/useCountries";
import { Modal as LibModal } from "rsuite";
import Button from "@/components/button";
import { getStorage } from "@/utils/storage";

function Transfer({
  account,
  handleCloseModal,
  fetchData,
}: {
  account: AccountType;
  handleCloseModal: () => void;
  fetchData: () => void;
}) {
  const { translation } = useContext(LanguageContext);
  const [userLoggedIn, setUserLoggedIn] = useState<any>({});

  const { provinces, loadingProvinces, fetchProvincesData } =
    useFetchProvinces("dropdown");
  const { districts, loadingDistricts, fetchDistrictsByProvinceData } =
    useFetchDistrictsByProvince("dropdown");
  const { sectors, loadingSectors, fetchSectorsByDistrictData } =
    useFetchSectorsByDistrict("dropdown");
  const { cells, loadingCells, fetchCellsBySectorData } =
    useFetchCellsBySector("dropdown");
  const { centers, loadingCenters, fetchCentersData } =
    useFetchCenters("dropdown");
  const { countries, loadingCountries, fetchCountriesData } =
    useFetchCountries("dropdown");

  useEffect(() => {
    fetchCentersData({
      offset: 0,
      limit: 50,
    });

    fetchCountriesData({ offset: 0, limit: 195 });

    const getUser = async () => {
      const user = await getStorage();
      setUserLoggedIn(user);
    };
    getUser();
  }, []);

  const validationSchema = Yup.object({
    // center: Yup.object()
    //   .required(translation.center_required)
    //   .typeError(translation.center_required),
  });

  useEffect(() => {
    if (account && account._id) {
      formik.setValues({
        center: account?.center
          ? {
              label: account?.center.name,
              value: account?.center._id,
            }
          : null,
      });
    }
  }, [account]);

  const formik = useFormik<AccountType>({
    initialValues: {
      center: null,
      accessRole: "",
      documentType: [],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        let method = "PATCH";
        let url = `/accounts/${account._id}`;
        let body = {
          centerId: values?.center?.value || "",
        };

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

  const onSuccess = (data: any) => {
    toastMessage("success", data.message);

    handleCloseModal();

    fetchData();
  };

  const canUpdateAccount = defineAccess({
    method: "update",
    module: "account",
  });

  if (!account._id) return <center>{translation.no_data_found}</center>;
  return (
    <div>
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
              formik.values?.country?.label?.toUpperCase() === "RWANDA"
                ? translation.province
                : translation.type
            }
            value={formik.values.province}
            onChange={(province) => formik.setFieldValue("province", province)}
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
              formik.values?.country?.label?.toUpperCase() === "RWANDA"
                ? translation.district
                : translation.continent
            }
            value={formik.values.district}
            error={formik.errors.district}
            onChange={(district) => formik.setFieldValue("district", district)}
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
              formik.values?.country?.label?.toUpperCase() === "RWANDA"
                ? translation.sector
                : translation.embassy
            }
            value={formik.values.sector}
            error={formik.errors.sector}
            onChange={(sector) => formik.setFieldValue("sector", sector)}
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
              formik.values?.country?.label?.toUpperCase() === "RWANDA"
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
        <LibModal.Footer style={{ marginTop: "1rem" }}>
          <Button
            text={translation.close}
            onClick={handleCloseModal}
            appearance="default"
          />
          {canUpdateAccount && userLoggedIn?.account?._id !== account._id && (
            <Button
              text={translation.submit}
              onClick={formik.handleSubmit}
              loading={formik.isSubmitting}
              disabled={!account}
            />
          )}
        </LibModal.Footer>
      </div>
    </div>
  );
}

export default Transfer;
