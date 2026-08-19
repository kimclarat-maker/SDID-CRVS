import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { LoginType } from "@/types/LoginType";
import LoginForm from "@/components/forms/login";
import { userLoginApi, userSendOTPByEmail } from "@/api/login";
import toastMessage from "@/utils/common/toastMessage";
import { clearStorage, getStorage, setStorage } from "@/utils/storage";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";
import OTPCode from "../code";
import { loginValidationSchema } from "@/validation/login.validation";
import FacialVerification from "@/screens/authentication/facial";
import errors from "@/constants/errors";
import { Heading, Text } from "rsuite";
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
import logoImage from "@/assets/logo.png";
import "./styles.css";

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
      const address = await getStorage("applicantAddress", "local");

      navigate("/dashboard/admin");

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
      <div className="loginScreenWrap">
        <div className="loginCard">
          <div className="loginBrandPanel">
            <div className="loginDotGrid" aria-hidden="true"></div>
            <div className="loginRings" aria-hidden="true"></div>

            <div className="loginBrandBadge">
              <svg viewBox="0 0 24 24" className="loginIcon">
                <path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4z"></path>
              </svg>
              National Identity Directorate
            </div>

            <div className="loginBrandMain">
              <h1>One secure identity platform for every Rwandan.</h1>
              <p>
                Staff console for civil registration and biometric
                enrollment &mdash; online or offline, at every service
                centre in the country.
              </p>
              <div className="loginBrandTags">
                <span className="loginTag">
                  <svg viewBox="0 0 24 24" className="loginIcon">
                    <rect x="3" y="10" width="18" height="6" rx="2"></rect>
                    <circle cx="8" cy="13" r="1.4" fill="#ffffff" stroke="none"></circle>
                    <path d="M13 13h5"></path>
                  </svg>
                  Biometric-grade security
                </span>
                <span className="loginTag">
                  <svg viewBox="0 0 24 24" className="loginIcon">
                    <path d="M4 15V6a2 2 0 0 1 2-2h9l5 5v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
                    <path d="M4 15l4-4 3 3 5-6 4 4"></path>
                  </svg>
                  Offline-ready capture
                </span>
              </div>
            </div>

            <div className="loginBrandStat">
              <div className="loginBrandStatIcon">
                <svg viewBox="0 0 24 24" className="loginIcon">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                  <circle cx="10" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <div className="loginBrandStatNumber">128,400+</div>
                <div className="loginBrandStatLabel">
                  citizens enrolled nationwide this year
                </div>
              </div>
            </div>
          </div>

          <div className="loginFormPanel">
            <div className="loginFormInner">
              <div className="loginFormLogo">
                <img src={logoImage} alt="SDID" />
                <span>
                  SDID <span className="loginFormLogoLight">Enrollment</span>
                </span>
              </div>

              <Heading level={3} className="loginFormTitle">
                Welcome back
              </Heading>
              <Text className="loginFormSubtitle">
                Sign in to the staff enrollment console.
              </Text>

              {offlineErrorMessage !== "" && (
                <div className="mb-3">
                  <Alert type="error">{offlineErrorMessage}</Alert>
                </div>
              )}

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

              <div className="loginTrustNote">
                <svg viewBox="0 0 24 24" className="loginIcon">
                  <path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4z"></path>
                  <path d="M9 12l2 2 4-4"></path>
                </svg>
                Your session is protected with device-bound multi-factor
                verification.
              </div>
            </div>
          </div>
        </div>
      </div>

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
