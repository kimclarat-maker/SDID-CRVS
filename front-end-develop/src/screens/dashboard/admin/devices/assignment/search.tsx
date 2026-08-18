import Input from "@/components/input";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchAccounts } from "@/hooks/useAccounts";
import toastMessage from "@/utils/common/toastMessage";
import { searchAccountValidationSchema } from "@/validation/search.account.validation";
import { useFormik } from "formik";
import React, { useContext, useMemo } from "react";
import { Avatar, List, Stack, Text } from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import Button from "@/components/button";
import { AccountType } from "@/types/Account";
import { assignDevice, unassignDevice } from "@/api/device";

interface Props {
  deviceId: string;
  accountId: string;
}

interface FormType {
  search: string;
  reason?: string;
}

interface ResultType {
  photo: string;
  firstName: string;
  lastName: string;
}

const Search: React.FC<Props> = ({ deviceId, accountId }) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchAccountData, loading } = useFetchAccounts("dropdown");

  const validationSchema = useMemo(
    () => searchAccountValidationSchema(translation),
    [translation],
  );

  const formik = useFormik<FormType>({
    initialValues: {
      search: "",
      reason: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
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
      const { data } = await assignDevice(deviceId, item._id, "");

      toastMessage(
        "success",
        data.message || translation.information_updated_success,
      );
    } catch (error) {
      toastMessage("error", error);
    }
  };

  const onUnAssign = async () => {
    try {
      const { data } = await unassignDevice(
        deviceId,
        formik.values.reason || "",
      );

      toastMessage(
        "success",
        data.message || translation.information_updated_success,
      );
    } catch (error) {
      toastMessage("error", error);
    }
  };

  return (
    <div>
      <Input
        loading={loading}
        onChange={(e) => formik.setFieldValue("search", e)}
        error={formik.touched.search && formik.errors.search}
        name="search"
        value={formik.values.search}
        placeholder={translation.search_placeholder}
      />
      {loading ? (
        <center>
          <Loading />
        </center>
      ) : (
        data?.length > 0 && (
          <List bordered>
            {data.map((el: AccountType, i: number) => {
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
                        {(el as any).firstName || ""}{" "}
                        {(el as any).lastName || ""}
                      </Text>
                    </Stack.Item>
                    <Stack.Item>
                      {el._id === accountId ? (
                        <Button
                          text={translation.unassign}
                          onClick={() => onUnAssign()}
                        />
                      ) : (
                        <Button
                          text={translation.assign}
                          onClick={() => onAssign(el)}
                        />
                      )}
                    </Stack.Item>
                  </Stack>
                </List.Item>
              );
            })}
          </List>
        )
      )}
    </div>
  );
};

export default Search;
