import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { ButtonToolbar, Modal as LibModal, Stack, Radio } from "rsuite";
import SelectDropdown from "@/components/select";
import RadioGroup from "@/components/radio/group";
import { useFetchCenters } from "@/hooks/useCenters";
import Address from "../address";
import Assign from "./assign";
import CustomTabs from "@/components/tabs";
import AuditLogs from "@/screens/dashboard/admin/devices/auditlogs/audit";
import { AccountType } from "@/types/Account";
import { getStorage } from "@/utils/storage";
import deviceTypes from "@/constants/deviceTypes";
import {
  cameras,
  fingerprints,
  irisDevices,
  laptops,
  signaturePads
} from "@/constants/devices";

interface FormTypes {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  setFieldValue: any;
  handleClose?: () => void;
  setFieldError: any;
  deviceId: string;
  accountId: string;
  formik: any;
  refreshList: () => void;
  setValues: (data: any) => void;
  isUpdate: boolean;
}
export default function DeviceForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
  deviceId,
  accountId,
  formik,
  refreshList
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const [showAddress, setShowAddress] = useState(false);

  const [userLoggedIn, setUserLoggedIn] = useState<AccountType>(
    {} as AccountType
  );

  const [tab, setTab] = useState("1");

  useEffect(() => {
    const getUser = async () => {
      const user = await getStorage();
      setUserLoggedIn(user);
    };

    getUser();
  }, []);

  const { centers, fetchCentersData, loadingCenters } =
    useFetchCenters("dropdown");

  useEffect(() => {
    handleFetchCenters();
  }, [
    values.country,
    values.province,
    values.district,
    values.sector,
    values.cell
  ]);

  const handleFetchCenters = (search?: string) => {
    return fetchCentersData({
      offset: 0,
      limit: 10,
      search,
      country: values?.country?.label,
      province: values?.province?.label,
      district: values?.district?.label,
      sector: values?.sector?.label,
      cell: values?.cell?.label
    });
  };

  const renderBasicInformation = () => {
    return (
      <>
        <div className="row">
          {/* {!isUpdate && (
            <>
              <div className="col-md-12">
                <SelectDropdown
                  options={deviceTypes}
                  name="deviceType"
                  label={translation.type}
                  required
                  value={values.deviceType}
                  onChange={(value) => setFieldValue("deviceType", value)}
                  error={errors.deviceType}
                />
              </div>
              {
                <div className="col-md-12">
                  <SelectDropdown
                    options={devices}
                    name="device"
                    label={translation.device}
                    value={values.device}
                    onChange={(value) => setFieldValue("device", value)}
                    error={errors.device}
                    loading={deviceLoading}
                  />
                </div>
              }
            </>
          )} */}

          <div className="col-md-12">
            <SelectDropdown
              options={deviceTypes}
              name="deviceType"
              label={translation.type}
              required
              value={values.deviceType}
              onChange={(value) => setFieldValue("deviceType", value)}
              error={errors.deviceType}
            />
          </div>

          <div className="col-md-12">
            <SelectDropdown
              options={
                values.deviceType?.value === "FACE"
                  ? cameras
                  : values.deviceType?.value === "FINGERPRINT"
                    ? fingerprints
                    : values.deviceType?.value === "IRIS"
                      ? irisDevices
                      : values.deviceType?.value === "LAPTOP"
                        ? laptops
                        : values.deviceType?.value === "SIGNATURE"
                          ? signaturePads
                          : []
              }
              name="serialNumber"
              label={translation.serial_number}
              placeholder={translation.serial_number_placeholder}
              required
              value={values.serialNumber}
              onChange={(value) => setFieldValue("serialNumber", value)}
              error={errors.serialNumber}
            />
          </div>
          <div className="col-md-6">
            <Input
              name="name"
              label={translation.name}
              placeholder={translation.name_placeholder}
              required
              value={values.name}
              onChange={(value) => setFieldValue("name", value)}
              error={errors.name}
            />
          </div>
          <div className="col-md-6">
            <Input
              name="item"
              label={translation.item}
              placeholder={translation.item_placeholder}
              required
              value={values.item}
              onChange={(value) => setFieldValue("item", value)}
              error={errors.item}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <Input
              name="model"
              label={translation.model}
              placeholder={translation.model_placeholder}
              required
              value={values.model}
              onChange={(value) => setFieldValue("model", value)}
              error={errors.model}
            />
          </div>
        </div>
      </>
    );
  };
  const renderCenter = () => {
    return (
      <div className="col-md-12">
        <SelectDropdown
          defaultOptions={centers}
          loadOptions={(e: string) => handleFetchCenters(e)}
          name="centerId"
          label={translation.center}
          required
          value={values.centerId}
          onChange={(value) => setFieldValue("centerId", value)}
          error={errors.centerId}
          type="async"
          loading={loadingCenters}
          rightContent={
            <Button
              text={
                !showAddress ? translation.show_filter : translation.hide_filter
              }
              onClick={() => setShowAddress(!showAddress)}
              size="sm"
            />
          }
        />
      </div>
    );
  };

  const renderStatus = () => {
    return (
      <>
        <div className="col-md-12">
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
                value: "ACTIVE"
              },
              {
                label: translation.inactive,
                value: "INACTIVE"
              }
            ].map((el: any, i) => {
              return (
                <Radio key={i} value={el.value}>
                  {el.label}
                </Radio>
              );
            })}
          </RadioGroup>
        </div>
      </>
    );
  };
  const renderCondition = () => {
    return (
      <>
        <div className="col-md-12">
          <RadioGroup
            name="condition"
            label={translation.condition}
            error={errors.condition}
            onChange={(condition) => setFieldValue("condition", condition)}
            value={values.condition}
            inline
          >
            {[
              {
                label: translation.new,
                value: "NEW"
              },
              {
                label: translation.used,
                value: "USED"
              },
              {
                label: translation.refurbished,
                value: "REFURBISHED"
              },

              {
                label: translation.damaged,
                value: "DAMAGED"
              },
              {
                label: translation.retired,
                value: "RETIRED"
              }
            ].map((el: any, i) => {
              return (
                <Radio key={i} value={el.value}>
                  {el.label}
                </Radio>
              );
            })}
          </RadioGroup>
        </div>
      </>
    );
  };
  const tabs = [
    {
      title: translation.basic_information,
      data: tab === "1" && (
        <>
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div className="card-body rs-modal-body">
              {renderBasicInformation()}

              {showAddress && (
                <Address
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  formik={formik}
                />
              )}
              {(!userLoggedIn?.account?.centerId ||
                userLoggedIn?.accessRole?.value === "SUPERADMIN" ||
                userLoggedIn?.accessRole?.value === "ADMIN") &&
                renderCenter()}
              {renderCondition()}
              {renderStatus()}
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
                  <Button
                    text={translation.submit}
                    onClick={handleSubmit}
                    loading={isSubmitting}
                  />
                </ButtonToolbar>
              </Stack.Item>
            </Stack>
          </LibModal.Footer>
        </>
      ),
      key: "1"
    },
    {
      title: translation.assignment,
      data: tab === "2" && (
        <div style={{ height: "60vh", overflowY: "auto" }}>
          <div className="card-body rs-modal-body">
            {deviceId && (
              <Assign
                deviceId={deviceId}
                accountId={accountId}
                refreshList={refreshList}
              />
            )}
          </div>
        </div>
      ),
      key: "2"
    },

    deviceId && {
      title: translation.audit_logs,
      data: tab === "3" && (
        <div style={{ height: "60vh", overflowY: "auto" }}>
          <div className="card-body rs-modal-body">
            {deviceId && <AuditLogs deviceId={deviceId} tab={tab} />}
          </div>
        </div>
      ),
      key: "3"
    }
  ].filter(Boolean);

  return <CustomTabs activeKey={tab} getTab={setTab} options={tabs} />;
}
