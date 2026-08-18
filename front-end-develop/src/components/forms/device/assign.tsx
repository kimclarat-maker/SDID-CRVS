import Input from "@/components/input";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchAccountById, useFetchAccounts } from "@/hooks/useAccounts";
import toastMessage from "@/utils/common/toastMessage";
import { searchAccountValidationSchema } from "@/validation/search.account.validation";
import { useFormik } from "formik";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  ButtonToolbar,
  IconButton,
  List,
  Stack,
  Tag,
  Text,
} from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import Button from "@/components/button";
import { AccountType } from "@/types/Account";
import { assignDevice, unassignDevice } from "@/api/device";
import Empty from "@/components/empty";
import Icon from "@/components/icon";
import { useFetchDeviceById } from "@/hooks/useDevices";

interface Props {
  deviceId: string;
  accountId: string;
  refreshList: () => void;
}

interface FormType {
  search: string;
  reason?: string;
}

interface ResultType {
  accountId: string;
}

const Assign: React.FC<Props> = ({ deviceId, accountId, refreshList }) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchAccountData } = useFetchAccounts("dropdown");
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const {
    data: deviceInfo,
    fetchDeviceData,
    loading: loadingDevice,
  } = useFetchDeviceById();

  const [hasFetched, setHasFetched] = useState(false);

  const [showReason, setShowReason] = React.useState(false);

  const [loader, setLoader] = useState({
    isRemoving: false,
    isAssigning: false,
  });

  useEffect(() => {
    if (deviceId) {
      fetchDeviceData(deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    let accountFiltered = data.filter(
      (item) => item._id !== deviceInfo?.accountId
    );

    setAccounts(accountFiltered);
  }, [data, deviceInfo]);

  const validationSchema = useMemo(
    () => searchAccountValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormType>({
    initialValues: {
      search: "",
      reason: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setHasFetched(false);
        setShowReason(false);

        let params = {};

        if (values.search.includes("@")) {
          params = {
            email: values.search,
          };
        } else {
          params = {
            idNumber: values.search,
          };
        }
        await fetchAccountData(params);
        setHasFetched(true);
      } catch (error: any) {
        console.log(error);
        toastMessage("error", error);
      }
    },
    validateOnMount: false,
    validateOnChange: true,
  });

  const onAssign = async (item: AccountType) => {
    try {
      setLoader((prev) => ({
        ...prev,
        isAssigning: true,
      }));
      const data = await assignDevice(deviceId, item._id, "");

      fetchDeviceData(data._id);

      setLoader((prev) => ({
        ...prev,
        isAssigning: false,
      }));

      toastMessage("success", data.message);

      refreshList();
    } catch (error) {
      toastMessage("error", error);
      setLoader((prev) => ({
        ...prev,
        isAssigning: false,
      }));
    }
  };

  const onUnAssign = async () => {
    try {
      setLoader((prev) => ({
        ...prev,
        isRemoving: true,
      }));
      const data = await unassignDevice(deviceId, formik.values.reason || "");

      fetchDeviceData(data._id);

      refreshList();

      setLoader((prev) => ({
        ...prev,
        isRemoving: false,
      }));

      toastMessage("success", data.message);

      setShowReason(false);
      formik.setFieldValue("reason", "");
    } catch (error) {
      toastMessage("error", error);
      setLoader((prev) => ({
        ...prev,
        isRemoving: false,
      }));
    }
  };

  const renderItem = (el: any, i: any) => {
    if (!el) return null;

    if (loadingDevice)
      return (
        <center>
          <Loading />
        </center>
      );
    return (
      <List.Item key={i}>
        <Stack spacing={16}>
          <Stack.Item>
            <Avatar
              circle
              size="sm"
              src={(el as any).photo || userImagePlaceholder}
            />
          </Stack.Item>
          <Stack.Item grow={1}>
            <Text>
              {(el as any).firstName || ""} {(el as any).lastName || ""}
            </Text>
            <Tag color={el._id === deviceInfo?.accountId ? "green" : "cyan"}>
              {deviceInfo?.accountId === el._id
                ? translation.assigned
                : translation.open}
            </Tag>
          </Stack.Item>
          <Stack.Item>
            {el._id === deviceInfo?.accountId ? (
              <Button
                text={translation.remove}
                onClick={() => {
                  setShowReason(true);

                  formik.setFieldValue("reason", "");
                }}
                startIcon="close"
                appearance="primary"
                color="red"
                size="sm"
              />
            ) : (
              <Button
                text={translation.add}
                onClick={() => onAssign(el)}
                startIcon="add"
                appearance="primary"
                loading={loader.isAssigning}
                size="sm"
              />
            )}
          </Stack.Item>
        </Stack>
      </List.Item>
    );
  };

  return (
    <div>
      <Stack spacing={16}>
        <Stack.Item grow={1}>
          <Input
            onChange={(e) => formik.setFieldValue("search", e)}
            error={formik.touched.search && formik.errors.search}
            name="search"
            value={formik.values.search}
            placeholder={translation.search_placeholder}
            containerStyles={{ marginBottom: 0 }}
          />
        </Stack.Item>
        <Stack.Item>
          <Button
            text={translation.search}
            onClick={formik.handleSubmit}
            loading={formik.isSubmitting}
          />
        </Stack.Item>
      </Stack>
      {deviceInfo?.account && (
        <>
          <br />
          {renderItem(deviceInfo?.account, 0)}
        </>
      )}
      {showReason && (
        <div className="mb-3">
          <Input
            onChange={(e) => formik.setFieldValue("reason", e)}
            error={formik.touched.reason && formik.errors.reason}
            name="reason"
            value={formik.values.reason}
            placeholder={translation.reason_placeholder}
            containerStyles={{ marginBottom: ".6rem" }}
          />
          <ButtonToolbar>
            <Button
              text={translation.reset}
              onClick={() => {
                setShowReason(false);

                formik.setFieldValue("reason", "");
              }}
              appearance="default"
            />
            <Button
              text={translation.submit}
              onClick={onUnAssign}
              loading={loader.isRemoving}
            />
          </ButtonToolbar>
        </div>
      )}

      {hasFetched && accounts.length === 0 && !deviceInfo?.account && (
        <Empty title={translation.no_data} isFullScreen />
      )}
      {accounts?.length > 0 && (
        <>
          <br />
          <List bordered>
            {data.map((el: AccountType, i: number) => {
              return <>{renderItem(el, i)}</>;
            })}
          </List>
        </>
      )}
    </div>
  );
};

export default Assign;
