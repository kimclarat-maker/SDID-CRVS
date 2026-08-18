import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useEffect, useMemo } from "react";
import PhoneNumberForm from "../forms/phoneNumber";
import {
  emailSkipSelfieValidationSchema,
  phoneSkipSelfieValidationSchema,
} from "@/validation/skip.selfie.validation";
import { useFormik } from "formik";
import { pairValidatorSkipRequestCode } from "@/api/skipSelfie";
import toastMessage from "@/utils/common/toastMessage";
import { useNavigate } from "react-router-dom";
import { replaceDialCode } from "@/utils/common/replaceDialCode";
import { applicantSelfieMatch } from "@/api/selfie";
import { isValidEmail } from "@/utils/common/validateEmail";
import EmailForm from "../forms/email";
import Alert from "../alert";

interface Props {
  goBack: () => void;
  prenrollmentId?: string;
  phoneNumber?: string;
  preEnrollmentNo?: string;
  enrollmentId?: string;
  accountId?: string;
  image: any;
  isBioRefresh?: boolean;
  email: string;
  isPairValidator?: boolean;
  handleClose?: () => void;
  isStartedOnline?: boolean;
}

interface FormTypes {
  country: any;
  phoneNumber: string;
  email: string;
}

const Skip: React.FC<Props> = ({
  goBack,
  prenrollmentId,
  phoneNumber,
  preEnrollmentNo,
  accountId,
  enrollmentId,
  image,
  isBioRefresh,
  email,
  isPairValidator,
  handleClose,
  isStartedOnline,
}) => {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();

  const validationSchema = useMemo(
    () =>
      email
        ? emailSkipSelfieValidationSchema(translation)
        : phoneSkipSelfieValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormTypes>({
    initialValues: {
      country: "+250",
      phoneNumber: phoneNumber || "",
      email: email || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (isBioRefresh || isPairValidator) {
          await onSkipForPairValidator();

          handleClose && handleClose();

          return;
        }

        if (prenrollmentId) {
          await onSkipPrenrollment(values);
          handleClose && handleClose();
          return;
        }

        await onSkipForPairValidator();
        handleClose && handleClose();
      } catch (error: any) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  const onSkipPrenrollment = async (values: FormTypes) => {
    try {
      if (prenrollmentId) {
        const data = await applicantSelfieMatch({
          image,
          preEnrollmentId: prenrollmentId,
          phoneNumber:
            (values.country || values.country.dialCode) +
            "" +
            values.phoneNumber,
          skipSelfieVerification: true,
          isStartedOnline,
        });
        toastMessage("success", data.message);

        if (isStartedOnline) {
          return navigate(
            `/dashboard/admin/request/exceptions/prenrollment/${preEnrollmentNo}?isStartedOnline=true`
          );
        }

        navigate(
          `/dashboard/admin/request/exceptions/prenrollment/${preEnrollmentNo}`
        );
      }
    } catch (error: any) {
      toastMessage("error", error);
      console.log("error", error);
    }
  };

  const onSkipForPairValidator = async () => {
    try {
      if (enrollmentId && accountId) {
        const data = await pairValidatorSkipRequestCode(
          enrollmentId,
          accountId,
          image,
          isBioRefresh,
          isStartedOnline
        );
        toastMessage("success", data.message);

        if (isStartedOnline) {
          return navigate(
            isBioRefresh
              ? `/dashboard/admin/request/exceptions/approver/refresh/${enrollmentId}/${accountId}?isRemoteFetch=true`
              : `/dashboard/admin/request/exceptions/approver/${enrollmentId}/${accountId}?isRemoteFetch=true`
          );
        }
        navigate(
          isBioRefresh
            ? `/dashboard/admin/request/exceptions/approver/refresh/${enrollmentId}/${accountId}`
            : `/dashboard/admin/request/exceptions/approver/${enrollmentId}/${accountId}`
        );
      }
    } catch (error) {
      console.log("error", error);
      toastMessage("error", error);
    }
  };

  const onSkipBioRefresh = async (values: FormTypes) => {
    try {
      if (!prenrollmentId) return;

      const data = await applicantSelfieMatch({
        image,
        preEnrollmentId: prenrollmentId,
        phoneNumber:
          (values.country || values.country.dialCode) + "" + values.phoneNumber,
        skipSelfieVerification: true,
        isBioRefresh: true,
      });

      toastMessage("success", data.message);
      navigate(
        `/dashboard/admin/request/exceptions/biorefresh${preEnrollmentNo}`
      );
    } catch (error) {
      toastMessage("error", error);
    }
  };

  useEffect(() => {
    if (!phoneNumber) return;
    const formattedPhone = replaceDialCode(
      phoneNumber.startsWith("0") ? phoneNumber.slice(1) : phoneNumber
    );
    formik.setFieldValue("phoneNumber", formattedPhone);
  }, [phoneNumber]);

  useEffect(() => {
    if (
      !email &&
      formik.values.phoneNumber?.startsWith("0") &&
      formik.values.phoneNumber.length > 1
    ) {
      const updatedPhoneNumber = formik.values.phoneNumber.slice(1);
      if (updatedPhoneNumber !== formik.values.phoneNumber) {
        formik.setFieldValue("phoneNumber", updatedPhoneNumber);
      }
    }
  }, [formik.values.phoneNumber]);

  useEffect(() => {
    if (email && isValidEmail(formik.values.email)) {
      formik.handleSubmit();
    }
  }, [formik.values.email]);

  if (email && email !== "" && isValidEmail(email)) {
    return (
      <div className="rs-modal-body">
        <br />
        <Alert title={translation.receive_otp} />
        <br />
        <EmailForm {...formik} goBack={goBack} />
        <br />
      </div>
    );
  }

  return (
    <div className="rs-modal-body">
      <PhoneNumberForm {...formik} goBack={goBack} />
      <br />
    </div>
  );
};

export default Skip;
