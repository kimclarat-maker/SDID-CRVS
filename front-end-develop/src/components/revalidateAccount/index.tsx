import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Button from "../button";
import { LanguageContext } from "@/context/LanguageContext";
import Input from "@/components/input";
import { userLoginApi } from "@/api/login";
import { verifyAccountValidationSchema } from "@/validation/login.validation";
import { useFormik } from "formik";
import { RevalidateAccountType } from "@/types/User";
import { clearStorage, getStorage, setStorage } from "@/utils/storage";
import toastMessage from "@/utils/common/toastMessage";
import Modal from "../Modal";
import { Heading, Stack } from "rsuite";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { mfaFacialVerification } from "@/api/selfie";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  isOnline: boolean;
}

const RevalidateAccount: React.FC<Props> = ({ open, setOpen, isOnline }) => {
  const { translation } = useContext(LanguageContext);
  const webcamRef = useRef<Webcam>(null);
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const convertToJPEG = (base64Data: string): string => {
    // This is a placeholder - in a real app you might use a canvas to convert
    if (base64Data.startsWith("data:image/jpeg")) {
      return base64Data;
    }
    // Simple conversion (note: this is conceptual - actual conversion requires canvas)
    return base64Data.replace(
      /^data:image\/[a-z]+;base64,/,
      "data:image/jpeg;base64,"
    );
  };

  const handleCapture = async () => {
    const imageSrc: any = webcamRef.current?.getScreenshot();

    if (imageSrc === null) return;

    const jpegImage = convertToJPEG(imageSrc);

    await setImage(jpegImage);

    return jpegImage;
  };

  // Get available devices
  const handleDevices = useCallback((mediaDevices: any) => {
    const videoDevices = mediaDevices.filter(
      ({ kind }: { kind: string }) => kind === "videoinput"
    );
    setDevices(videoDevices);
    if (videoDevices.length > 0) {
      setDeviceId(videoDevices[0].deviceId); // Default to first device
    }
  }, []);

  useEffect(() => {
    navigator &&
      navigator.mediaDevices &&
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const validationSchema = useMemo(
    () => verifyAccountValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<RevalidateAccountType>({
    initialValues: {
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const user = await getStorage();
        const data = await userLoginApi({
          email: user.email,
          password: values.password,
        });

        if (data) {
          if (!image) return toastMessage("error", translation.selfie_required);

          await verifyWithSelfie(data.tempToken, image);
        }
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  const handleShowPassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  const verifyWithSelfie = async (token: string, image: string) => {
    try {
      const user = await getStorage();
      const data = await mfaFacialVerification(image, user.email, token);

      console.log("mfa facial login", data);
      await setOpen(data);

      await setStorage(data);

      setOpen(false);

      // await setStorage(isOnline ? "ONLINE" : "OFFLINE", "status");
      sessionStorage.setItem("REVALIDATE", "COMPLETED");
    } catch (error) {
      console.log(error);
      toastMessage("error", error);
      sessionStorage.removeItem("REVALIDATE");
    }
  };

  const handleClose = () => {
    clearStorage();
    setOpen(false);
    navigate("/authentication/login");
  };

  return (
    <Modal show={open} handleClose={handleClose} size="xs" backdrop="static">
      <div className="rs-modal-body">
        <center>
          <Heading level={4}>{translation.verify_its_you}</Heading>
          <br />
          {image ? (
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 150,
                transformOrigin: "center",
                overflow: "auto",
              }}
            >
              <img src={image} />
            </div>
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              videoConstraints={{
                deviceId: deviceId,
                width: 250,
                height: 250,
              }}
              style={{
                width: 250,
                height: 250,
                borderRadius: 150,
                transformOrigin: "center",
              }}
            />
          )}
        </center>
        <Input
          name="password"
          label={translation.password}
          value={formik.values.password}
          onChange={(e) => formik.setFieldValue("password", e)}
          placeholder={translation.password_placeholder}
          leftIcon="lock"
          rightIcon={passwordVisible ? "visibility" : "visibility_off"}
          handleShowPassword={handleShowPassword}
          testId="password"
          error={formik.errors.password}
          type={passwordVisible ? "text" : "password"}
        />
        <Stack spacing={16}>
          <Stack.Item grow={1}>
            <Button
              appearance="default"
              text={translation.go_back}
              onClick={handleClose}
            />
          </Stack.Item>
          <Stack.Item>
            {image && !formik.isSubmitting ? (
              <Button
                text={translation.retake}
                onClick={() => {
                  setImage(null);
                }}
              />
            ) : (
              <Button
                text={translation.verify}
                onClick={() => {
                  handleCapture();
                  formik.handleSubmit();
                }}
                loading={formik.isSubmitting}
              />
            )}
          </Stack.Item>
        </Stack>
      </div>
    </Modal>
  );
};

export default RevalidateAccount;
