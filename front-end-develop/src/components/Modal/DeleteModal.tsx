import { useContext } from "react";
import Button from "../button";
import Input from "../input";
import { LanguageContext } from "@/context/LanguageContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "@/api";
import toastMessage from "@/utils/common/toastMessage";
import { Modal, Text } from "rsuite";
import { isDemoMode, demoDelay } from "@/demo/config";
import {
  demoDeleteAccount,
  demoDeleteCenter,
  demoDeleteDevice,
} from "@/demo/services/administration";
import {
  demoDeleteDocumentType,
  demoDeleteHoliday,
  demoDeleteSupportingDocument,
} from "@/demo/services/referenceLookups";
import {
  demoDeleteEmailSetting,
  demoDeleteEmailTemplate,
  demoDeleteSMSSetting,
  demoDeleteSMSTemplate,
} from "@/demo/services/messaging";
import {
  demoDeleteCountry,
  demoDeleteProvince,
  demoDeleteDistrict,
  demoDeleteSector,
  demoDeleteCell,
  demoDeleteVillages,
} from "@/demo/services/geography";

type DeleteType = {
  password: string;
};

// Every screen in the app that deletes a record reuses this one modal,
// passing whatever real-backend `url` it would DELETE — since demo mode
// short-circuits happen per-src/api/* module elsewhere, but this modal
// calls api() directly and bypasses that entirely, deletion needs its own
// dispatch here based on the url shape rather than being fixed 21 call
// sites individually. Extracts the last path segment as the record id.
// Falls back to a no-op "success" (never throws) for resource types with no
// meaningful demo-mutable collection (e.g. core role/permission fixtures
// other demo data assumes exist) rather than inventing risky fake state.
const demoDelete = async (url: string): Promise<{ message: string }> => {
  const id = url.split("/").filter(Boolean).pop() || "";

  if (url.startsWith("/accounts/")) return (await demoDeleteAccount(id)).data;
  if (url.startsWith("/devices/")) return (await demoDeleteDevice(id)).data;
  if (url.startsWith("/configuration/centers/") && !url.includes("/offday"))
    return (await demoDeleteCenter(id)).data;
  if (url.startsWith("/configuration/document-types/"))
    return (await demoDeleteDocumentType(id)).data;
  if (url.startsWith("/configuration/holidays/"))
    return (await demoDeleteHoliday(id)).data;
  if (url.startsWith("/configuration/supporting-documents/"))
    return (await demoDeleteSupportingDocument(id)).data;
  if (url.startsWith("/configuration/email-templates/"))
    return (await demoDeleteEmailTemplate(id)).data;
  if (url.startsWith("/configuration/email-settings/"))
    return (await demoDeleteEmailSetting(id)).data;
  if (url.startsWith("/configuration/sms-templates/"))
    return (await demoDeleteSMSTemplate(id)).data;
  if (url.startsWith("/configuration/sms-settings/"))
    return (await demoDeleteSMSSetting(id)).data;
  if (url.startsWith("/geo/countries/")) return (await demoDeleteCountry(id)).data;
  if (url.startsWith("/geo/provinces/")) return (await demoDeleteProvince(id)).data;
  if (url.startsWith("/geo/districts/")) return (await demoDeleteDistrict(id)).data;
  if (url.startsWith("/geo/sectors/")) return (await demoDeleteSector(id)).data;
  if (url.startsWith("/geo/cells/")) return (await demoDeleteCell(id)).data;
  if (url.startsWith("/geo/villages/")) return (await demoDeleteVillages(id)).data;

  // Access rights, modules/menus, per-center offdays, and anything else
  // without a dedicated demo collection: simulate success without mutating
  // shared fixtures other demo data depends on.
  return demoDelay({ message: "Deleted successfully." });
};

const DeleteData = ({
  secretText,
  handleCloseModal,
  url,
  refreshListData,
  data: requestData,
}: {
  secretText: string;
  handleCloseModal: () => void;
  url: string;
  refreshListData?: any;
  // () => void;
  data: any;
}) => {
  const { translation } = useContext(LanguageContext);

  const validationSchema = Yup.object({
    password: Yup.string().required(translation.secret_text_required),
  });

  const formik = useFormik<DeleteType>({
    initialValues: {
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async () => {
      try {
        if (isDemoMode()) {
          const data = await demoDelete(url);
          onSuccess(data);
          return;
        }

        let method = "DELETE";

        const options = {
          method,
          url,
          data: requestData,
        };

        const { data } = await api(options);
        onSuccess(data);
      } catch (error: any) {
        console.log(error);
        toastMessage("error", error);
      }
    },
  });

  const onSuccess = async (data: any) => {
    toastMessage("success", data.message || translation.delete_success);
    handleCloseModal && handleCloseModal();
    refreshListData && refreshListData();
  };

  return (
    <div className="card">
      <div className="card-body">
        <Text>
          {translation.delete_title}{" "}
          <b>
            <code title="Copy this text">{secretText}</code>
          </b>{" "}
          {translation.to_confirm}` <br />
          {translation.or_type} <span className="textBold"> DELETE</span>
        </Text>
        <br />

        <Input
          name="password"
          leftIcon="lock"
          value={formik.values.password}
          error={formik.errors.password}
          onChange={(value) => formik.setFieldValue("password", value)}
        />
      </div>
      <Modal.Footer>
        <Button
          text={translation.cancel}
          appearance="default"
          onClick={handleCloseModal}
        />

        <Button
          text={translation.submit}
          color="red"
          disabled={
            formik.values.password !== secretText &&
            formik.values.password !== "DELETE"
          }
          onClick={formik.handleSubmit}
          loading={formik.isSubmitting}
        />
      </Modal.Footer>
    </div>
  );
};

export default DeleteData;
