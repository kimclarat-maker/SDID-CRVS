import Input from "@/components/input";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchAccounts } from "@/hooks/useAccounts";
import toastMessage from "@/utils/common/toastMessage";
import { searchAccountValidationSchema } from "@/validation/search.account.validation";
import { useFormik } from "formik";
import React, { useContext, useMemo, useState } from "react";
import { Avatar, List, Stack, Tag, Text } from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import Button from "@/components/button";
import { AccountType } from "@/types/Account";
import Empty from "@/components/empty";
import { assignOfficer } from "@/api/enrollments";

interface Props {
  enrollmentId: string;
  accountId: string;
  fetchData: () => void;
  setOfficerModal: (open: boolean) => void;
}

interface FormType {
  search: string;
  reason?: string;
}

const ChangeOfficer: React.FC<Props> = ({
  enrollmentId,
  accountId,
  fetchData,
  setOfficerModal,
}) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchAccountData } = useFetchAccounts("dropdown");

  const [hasFetched, setHasFetched] = useState(false);

  const [loader, setLoader] = useState({
    isRemoving: false,
    isAssigning: false,
  });

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

  const onAssign = async (account: AccountType) => {
    try {
      setLoader((prev) => ({
        ...prev,
        isAssigning: true,
      }));
      const data = await assignOfficer(enrollmentId, account._id);

      fetchData();

      setLoader((prev) => ({
        ...prev,
        isAssigning: false,
      }));

      toastMessage("success", data.message);

      setOfficerModal(false);
    } catch (error) {
      toastMessage("error", error);
      setLoader((prev) => ({
        ...prev,
        isAssigning: false,
      }));
    }
  };

  const renderItem = (el: any, i: any) => {
    if (!el) return null;

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
            <Tag color={el._id === accountId ? "green" : "cyan"}>
              {el._id === accountId ? translation.assigned : translation.open}
            </Tag>
          </Stack.Item>
          <Stack.Item>
            {el._id === accountId ? (
              <></>
            ) : (
              <Button
                text={translation.add}
                onClick={() => onAssign(el)}
                startIcon="add"
                appearance="primary"
                loading={loader.isAssigning}
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
      {data?.length === 0 && <br />}

      {hasFetched && data.length === 0 && (
        <Empty title={translation.no_data} isFullScreen />
      )}
      {data?.length > 0 && (
        <>
          <br />
          <List>
            {data.map((el: AccountType, i: number) => {
              return <>{renderItem(el, i)}</>;
            })}
          </List>
        </>
      )}
    </div>
  );
};

export default ChangeOfficer;
