import { SessionContextType } from "@/types/Session";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { clearStorage, getStorage } from "@/utils/storage";
import toastMessage from "@/utils/common/toastMessage";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "@/api";
import OTPCode from "@/screens/authentication/code";
import LoginFacialVerification from "@/screens/authentication/facial";
import Modal from "@/components/Modal";
import { useNavigate } from "react-router-dom";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const SessionContext = createContext<SessionContextType>({
  session: null,
  setSession: () => {},
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<any>(null);
  const [count, setCount] = useState(0);
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSending, setSendingOTP] = useState(false);
  const [mfaType, setMFAType] = useState<"facial" | "otp">("facial");
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      if (!open) {
        setOpen(true);
      }
    }, SESSION_TIMEOUT);
  };

  const handleActivity = () => {
    if (!open) {
      resetTimer();
    }
  };

  const handleSuccessfulReauth = () => {
    setOpen(false);
    resetTimer(); // Restart the timer after successful auth
  };

  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getStorage();
      setUser(user);
    };

    getUserInfo();

    // Set up event listeners for user activity
    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Initialize the inactivity timer
    resetTimer();

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, []);

  const requestRenewSession = async () => {
    try {
      setSendingOTP(true);
      const { data } = await api({
        url: "/auth/send-session-renew-code",
        method: "POST",
      });

      setSendingOTP(false);
      setCount((prev) => prev + 1);
      toastMessage("success", data.message);
      setMFAType("otp");
    } catch (error) {
      toastMessage("error", error);
      setSendingOTP(false);
    }
  };

  const hashEmail = (email: string): string => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email; // Fallback to original if invalid

    const hashedLocalPart =
      localPart.length > 2
        ? localPart[0] + "*".repeat(localPart.length - 2) + localPart.slice(-1)
        : localPart;

    return `${hashedLocalPart}@${domain}`;
  };

  const validationSchema = Yup.object({
    code: Yup.number()
      .min(6, translation.otp_code_description)
      .required(translation.otp_code_required),
  });

  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Handle OTP submission here
        // On success:
        handleSuccessfulReauth();
      } catch (error) {
        toastMessage("error", error);
        resetTimer();
      }
    },
  });

  useEffect(() => {
    if (formik.values.code.length === 6) {
      formik.handleSubmit();
    }
  }, [formik.values.code]);

  const renderModal = () => (
    <Modal
      show={open}
      backdrop="static"
      role="alertdialog"
      title={mfaType === "otp" ? translation.otp_title : ""}
      description={`${translation.otp_description} ${
        user && hashEmail(user.email)
      }`}
    >
      {mfaType === "otp" ? (
        <OTPCode
          user={user}
          handleSwitchMFAType={() => setMFAType("facial")}
          isRenewSession
          setOpenModal={setOpen}
          timeoutId={timeoutId}
          requestRenewSession={requestRenewSession}
        />
      ) : (
        <LoginFacialVerification
          email={user?.email}
          tempToken={user?.token}
          handleSwitchMFAType={requestRenewSession}
          isRenewSession
          setOpenModal={setOpen}
          type="renew-session"
          isLoadingOTP={isSending}
          handleClose={async () => {
            await clearStorage();
            setOpen(false);
            navigate("/authentication/login");
          }}
        />
      )}
    </Modal>
  );

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
      {user?.token && renderModal()}
    </SessionContext.Provider>
  );
};
