import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { LoginType } from "@/types/LoginType";
import FormLayout from "@/layout/form/formLayout";
import LoginForm from "@/components/forms/login";
import { userLoginApi, userSendOTPByEmail } from "@/api/login";
import toastMessage from "@/utils/common/toastMessage";
import { clearStorage, getStorage, setStorage } from "@/utils/storage";
import { isTokenExpired } from "@/utils/common/isTokenExpired";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";
import OTPCode from "../code";
import { loginValidationSchema } from "@/validation/login.validation";
import FacialVerification from "@/screens/authentication/facial";
import errors from "@/constants/errors";
import { Heading, Panel, PanelGroup, Text } from "rsuite";
import Button from "@/components/button";
import AddressStep from "../facial/address";
import { AddressType } from "@/types/OTP";
import { addressValidationSchema } from "@/validation/otp.validation";
import { LoginAddress } from "@/types/geography";
import { fetchAPIServiceInfo } from "@/api/health";
import { apiHandler } from "@/api";
import Alert from "@/components/alert";
import { cfg } from "@/constants/cfg";
import axios from "axios";
import { isDemoMode } from "@/demo/config";
import { allStaffDemoCredentials, findDemoCredential } from "@/demo/credentials";
import { startDemoSession } from "@/demo/session";
import DemoAccountsPanel from "@/components/demoAccountsPanel";
import DemoBadge from "@/components/demoBadge";
import { resolvePostLoginRoute } from "@/utils/workspace";

interface Address {
  province?: AddressType | null;
  district?: AddressType | null;
  sector?: AddressType | null;
  cell?: AddressType | null;
  village?: AddressType | null;
  center?: AddressType | null;
}

export default function Login({
  getStarted,
  isLocalServiceEnabled
}: {
  getStarted?: boolean;
  isLocalServiceEnabled?: boolean;
}) {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>({});
  const [openModal, setOpenModal] = useState(false);
  const [mfaType, setMFAType] = useState("facial");
  const [isLoadingOTP, setLoadingOTP] = useState(false);
  const [address, setAddress] = useState<any>({});
  const [enableLogin, setEnableLogin] = useState(true);
  const [offlineErrorMessage, setOfflineErrorMessage] = useState("");

  const validationSchema = useMemo(
    () => loginValidationSchema(translation),
    [translation]
  );

  const addressValidation = useMemo(
    () => addressValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<LoginType>({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema,
    onSubmit: async (values) => {
      if (isDemoMode()) {
        const credential = findDemoCredential(values.email, values.password);
        if (!credential) {
          toastMessage(
            "error",
            "Invalid demo credentials. Use one of the accounts listed below."
          );
          return;
        }
        await startDemoSession(credential);
        navigate(resolvePostLoginRoute());
        return;
      }

      try {
        await localStorage.removeItem("loginType");
        const data = await userLoginApi(
          {
            email: values.email,
            password: values.password
          }
          // isLocalServiceEnabled
        );

        if (data) {
          await setUserInfo({
            email: values.email,
            password: values.password,
            ...data,
            message: translation.otp_description,
            image: data.photo
          });
          setMFAType("facial");
          setOpenModal(true);

          if (data.location) {
            handleUpdateAddress(data.location, true);
          }

          if (data.tempToken) {
            await setStorage(data.tempToken, "tempToken");
          }
        } else {
          // userLoginApi() swallows its own errors (it's also used by
          // silent background token-refresh callers that must not toast on
          // every network blip) and its "Network Error"/connection-refused
          // messages are deliberately suppressed by toastMessage's
          // EXCLUDED_MESSAGES. Without this, a direct, user-initiated login
          // attempt against an unreachable API shows nothing at all.
          toastMessage("error", errors(translation.default, undefined)["001"]);
        }
      } catch (error) {
        toastMessage("error", errors(translation.default, error)["001"]);
      }
    },
    enableReinitialize: true
  });

  const handleSendOTP = async () => {
    try {
      setLoadingOTP(true);
      await userSendOTPByEmail(
        userInfo.email,
        userInfo.tempToken
        // isLocalServiceEnabled
      );
      setLoadingOTP(false);
      setMFAType("otp");
    } catch (error: any) {
      toastMessage("error", error);
      setLoadingOTP(false);
      if (error?.response?.data?.statusCode === 401) {
        clearStorage();
        navigate("/authentication/login");
      }

      if (error?.response?.data?.message?.includes("OTP is not expired yet")) {
        setMFAType("otp");
      }
    }
  };

  const addressFormik = useFormik<Address>({
    initialValues: {
      province: address?.province,
      district: null,
      sector: null,
      cell: null,
      village: null
    },
    validationSchema: addressValidation,
    onSubmit: async (values: any) => {
      try {
        handleUpdateAddress(values, false);
      } catch (error: any) {
        console.log(error);
        toastMessage("error", error);
      }
    }
  });

  useEffect(() => {
    const handleUserInfo = async () => {
      const user = await getStorage();
      const address = await getStorage("applicantAddress", "local");

      if (user?.token && !isTokenExpired(user.token)) {
        navigate(resolvePostLoginRoute());
      }

      if (address) {
        setAddress(address);
        addressFormik.setValues({});
      }
    };

    handleUserInfo();
  }, []);

  const handleUpdateAddress = async (
    values: LoginAddress,
    isFormatted: boolean
  ) => {
    await setStorage(
      isLocalServiceEnabled ? "local" : "remote",
      "loginType",
      "local"
    );
    if (isFormatted) {
      setAddress(values);
      populateAddressForm(values);
      await setStorage(values, "applicantAddress", "local");
      return;
    }

    const address = {
      province: {
        name: values?.province?.name || localStorage?.province?.name,
        id: values?.province?.value || localStorage?.province?.id,
        code: values?.province?.code || localStorage?.province?.code
      },
      district: {
        name: values?.district?.name || localStorage?.district?.name,
        id: values?.district?.value || localStorage?.district?.id,
        code: values?.district?.code || localStorage?.district?.code
      },
      sector: {
        name: values?.sector?.name || localStorage?.sector?.name,
        id: values?.sector?.value || localStorage?.sector?.id,
        code: values?.sector?.code || localStorage?.sector?.code
      },
      cell: {
        name: values?.cell?.name || localStorage?.cell?.name,
        id: values?.cell?.value || localStorage?.cell?.id,
        code: values?.cell?.code || localStorage?.cell?.code
      },
      village: {
        name: values?.village?.name || localStorage?.village?.name,
        id: values?.village?.value || localStorage?.village?.id,
        code: values?.village?.code || localStorage?.village?.code
      }
    };

    setAddress(address);
    await setStorage(address, "applicantAddress", "local");

    populateAddressForm(address);
  };

  const populateAddressForm = (address: LoginAddress) => {
    const form = {
      province: address?.province
        ? {
            ...address?.province,
            label: address?.province?.name,
            value: address?.province?.id
          }
        : null,
      district: address?.district
        ? {
            ...address?.district,
            label: address?.district?.name,
            value: address?.district?.id
          }
        : null,
      sector: address?.sector
        ? {
            ...address?.sector,
            label: address?.sector?.name,
            value: address?.sector?.id
          }
        : null,
      cell: address?.cell
        ? {
            ...address?.cell,
            label: address?.cell?.name,
            value: address?.cell?.id
          }
        : null,
      village: address?.village
        ? {
            ...address?.village,
            label: address?.village?.name,
            value: address?.village?.id
          }
        : null
    };

    addressFormik.setValues(form);
  };

  useEffect(() => {
    const getInfo = async () => {
      try {
        console.log("Offline service check...");
        const data = await fetchAPIServiceInfo();

        const apiHandlerURL = await apiHandler();

        if (
          isLocalServiceEnabled &&
          data.apiGatewayBaseUrl + "/api/v1" === apiHandlerURL &&
          data.syncStatus?.toUpperCase() === "INACTIVE"
        ) {
          updateSyncOfflineStatus();
        }
        setOfflineErrorMessage("");
        setEnableLogin(true);
      } catch (error: any) {
        console.log("Error fetching offline service info:", error?.response);
        if (error?.response?.status === 404) {
          setOfflineErrorMessage(translation.using_old_offline_version);
          setEnableLogin(false);
        }
      }
    };
    if (isLocalServiceEnabled) {
      getInfo();
    }
  }, [isLocalServiceEnabled]);

  const updateSyncOfflineStatus = async () => {
    try {
      const options = {
        method: "POST",
        data: {
          status: "active"
        },
        url: `${cfg.VITE_LOCAL_SERVICE_API}/health/sync-status`
      };

      const res = await axios(options);
      console.log("offline updated status", res);
    } catch (error) {
      toastMessage("error", error);
    }
  };

  return (
    <>
      <FormLayout size={4}>
        {offlineErrorMessage !== "" && (
          <div className="mb-3">
            <Alert type="error">{offlineErrorMessage}</Alert>
          </div>
        )}
        <Heading level={4}>
          <Text className="textPrimary">{translation.login}</Text>
        </Heading>
        <DemoBadge />

        <br />
        <form
          onSubmit={formik.handleSubmit}
          className="formBody"
          data-testid="login-form"
        >
          <LoginForm {...formik} enableLogin={enableLogin} />
        </form>
        <Button
          text={translation.forgot_password}
          onClick={() => navigate("/authentication/forgotPassword")}
          block
          testId="forgot_password"
          appearance="ghost"
        />
        {isDemoMode() && (
          <DemoAccountsPanel
            accounts={allStaffDemoCredentials}
            onUseAccount={(credential) => {
              formik.setValues({
                email: credential.email,
                password: credential.password,
              });
            }}
          />
        )}
      </FormLayout>

      <Modal
        show={openModal}
        title={
          mfaType === "otp"
            ? translation.otp_title
            : translation.facial_verification
        }
        description={
          mfaType === "otp"
            ? `${userInfo && userInfo.message} - ${formik.values.email}`
            : translation.face_verification_description
        }
        handleClose={() => setOpenModal(false)}
        testId="mfa-modal"
        // size="lg"
      >
        {
          <div style={{ height: "" }}>
            <div className="row">
              <div
                className="col-md-6"
                style={{ maxHeight: "50vh", overflowY: "auto" }}
              >
                <AddressStep formik={addressFormik} />
              </div>
              <div className={`col-md-6`} style={{ position: "relative" }}>
                {mfaType === "facial" && (
                  <FacialVerification
                    email={formik.values.email}
                    userInfo={userInfo}
                    tempToken={userInfo.tempToken}
                    handleSwitchMFAType={() => handleSendOTP()}
                    getStarted={getStarted}
                    isLoadingOTP={isLoadingOTP}
                    handleClose={() => setOpenModal(false)}
                    address={address}
                    handleSubmit={addressFormik.handleSubmit}
                    errors={addressFormik.errors}
                    isLocalServiceEnabled={isLocalServiceEnabled}
                  />
                )}
                {mfaType === "otp" && (
                  <OTPCode
                    user={userInfo}
                    getStarted={getStarted}
                    handleSwitchMFAType={() => setMFAType("facial")}
                    handleSubmit={addressFormik.handleSubmit}
                    addressFormik={addressFormik}
                    isLocalServiceEnabled={isLocalServiceEnabled}
                  />
                )}
              </div>
            </div>
          </div>
        }
      </Modal>
    </>
  );
}
