import { useContext } from "react";
import Button from "../button";
import Input from "../input";
import { LanguageContext } from "@/context/LanguageContext";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "@/api";
import toastMessage from "@/utils/common/toastMessage";
import { Modal, Text } from "rsuite";

type DeleteType = {
  password: string;
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
