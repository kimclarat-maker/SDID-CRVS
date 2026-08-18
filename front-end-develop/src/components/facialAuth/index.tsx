import { useEffect } from "react";
import { onMatchFacialForPairValidator, onStart } from "@/api/enrollments";
import {
  applicantSelfieEmbedding,
  applicantSelfieMatch,
  applicantSelfieWithoutMatch,
  faceEmbedding,
  faceMatchProbability
} from "@/api/selfie";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import toastMessage from "@/utils/common/toastMessage";
import React, { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import SelectDropdown from "@/components/select";
import { ButtonToolbar, List, Panel } from "rsuite";
import Skip from "./skip";
import api from "@/api";
import { updateSchedules } from "@/api/schedules";
import ChangeOfficer from "../profile/changeOfficer";
import { defineAccess } from "@/utils/common/permissions";
import { pairValidatorDirectSkipRequestCode } from "@/api/skipSelfie";
import { getStorage } from "@/utils/storage";
import Checkbox from "../checkbox";

interface Props {
  prenrollmentId?: string;
  setOpen: (open: boolean) => void;
  preEnrollmentNo?: string;
  phoneNumber?: string;
  enrollmentId?: string;
  accountId?: string;
  setActiveIndex?: (index: number) => void;
  prevIndex?: any;
  isBioRefresh?: boolean;
  email?: string;
  isInitial?: boolean;
  isPairValidator?: boolean;
  isResuming?: boolean;
  resumeId?: string;
  requestNumber?: string;
  photo: string;
  isStartedOnline?: boolean;
}

interface Device {
  label: string;
  value: string;
}

const FacialAuth: React.FC<Props> = ({
  setOpen,
  prenrollmentId,
  preEnrollmentNo,
  phoneNumber,
  enrollmentId,
  accountId,
  email,
  setActiveIndex,
  prevIndex,
  isBioRefresh,
  isInitial = false,
  isPairValidator,
  isResuming,
  resumeId,
  requestNumber,
  photo,
  isStartedOnline
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<Device | undefined>(
    undefined
  );
  const [isFailed, setFailed] = useState(false);
  const [isSkipping, setSkipping] = useState(false);
  const [page, setPage] = useState(1);
  const [canRessign, setCanRessign] = useState(false);
  const [isSendingDirectOTP, setSendingDirectOTP] = useState(false);
  const [isDiplomat, setDiplomat] = useState(false);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();

        const videoDevices = mediaDevices.filter(
          (device) =>
            device.kind === "videoinput" && device.label.includes("AnkerWork")
        );
        const listDevices = videoDevices.map((el) => {
          return {
            ...el,
            label: el.label,
            value: el.deviceId
          };
        });
        setDevices(listDevices);

        // Set the first camera as default if none is selected
        if (listDevices.length > 0 && !activeDeviceId) {
          setActiveDeviceId(listDevices[0]);
        }
      } catch (error) {
        console.error("Error listing cameras:", error);
        toastMessage("error", error);
      }
    };

    getCameras();
  }, []);

  const handleDeviceChange = (event: Device) => {
    setActiveDeviceId(event);
  };

  const handleCapture = async () => {
    try {
      setCanRessign(false);
      const imageSrc: any = webcamRef.current?.getScreenshot();

      setLoading(true);

      if (imageSrc) {
        setImage(imageSrc);
        await onVerify(imageSrc);
      }
    } catch (error) {
      setCanRessign(false);
      toastMessage("error", error);
      setLoading(false);
    }
  };

  const onVerify = async (image: string) => {
    if (isBioRefresh && isInitial) return handleBioRefresh(image, isDiplomat);

    if (enrollmentId && accountId) {
      await verifyEnrollment(image);
      return;
    }
    await verifyPrenrollment(image);
  };

  const verifyEnrollment = async (image: string) => {
    try {
      if (enrollmentId && accountId) {
        const data: any = await onMatchFacialForPairValidator(
          {
            enrollmentId,
            accountId,
            approverSelfie: image
          },
          isBioRefresh,
          isStartedOnline
        );

        console.log("selfie match", data);

        toastMessage("success", data.message);
        if (isStartedOnline) {
          return navigate(
            `/dashboard/admin/enrollment/${data.data._id}?isRemoteFetch=true`
          );
        }
        navigate(`/dashboard/admin/enrollment/${data.data._id}`);
      }
    } catch (error) {
      setFailed(true);
      toastMessage("error", error);
      setLoading(false);
      console.log("selfie match error", error);
    }
  };

  const handleBioRefresh = async (image: string, isDiplomat = false) => {
    try {
      if (enrollmentId) {
        const data: any = await onStart({
          isBioRefresh: true,
          payload: {
            enrollmentId,
            verificationSelfie: image,
            isDiplomat
          }
        });

        if (data.message === "Selfie does not match.") {
          toastMessage("error", data.message);
          setLoading(false);

          return;
        }

        toastMessage("success", data.message);

        setLoading(false);
        setFailed(false);

        navigate(
          `/dashboard/admin/enrollment/bio-refresh/${enrollmentId}/${data.bioRefreshToken}`
        );
      }
    } catch (error) {
      setFailed(true);
      toastMessage("error", error);
      setLoading(false);
      console.log("selfie match error", error);
    }
  };

  const verifyPrenrollment = async (
    image: string,
    isFallback = false,
    isFallbackThirdTimes = false
  ): Promise<void> => {
    try {
      if (!prenrollmentId) {
        toastMessage("error", "Prenrollment ID not found.");
        setLoading(false);
        return;
      }

      const canUseOffline = defineAccess({
        method: "get",
        module: "offline"
      });

      let data: any = null;

      // If fallback, skip face matching
      if (isFallback || canUseOffline) {
        // const { embedding } = await faceEmbedding({ image });

        data = await applicantSelfieMatch({
          image,
          preEnrollmentId: prenrollmentId,
          isStartedOnline
          // embedding,
        });
      } else {
        // Perform face match
        const { probability } = await faceMatchProbability({
          photoOne: image,
          photoTwo: photo
        });

        if (probability < 0.9) {
          setFailed(true);
          toastMessage("error", "Selfie does not match.");
          // setLoading(false);
          return;
        }

        data = await applicantSelfieWithoutMatch({
          image,
          preEnrollmentId: prenrollmentId
        });
      }

      // If resuming enrollment
      if (resumeId) {
        // if (isStartedOnline) {
        //   navigate(
        //     `/dashboard/admin/enrollment/biometrics/start/${resumeId}/${data.bioToken}?isRemoteFetch=true`
        //   );
        //   return;
        // }
        // navigate(
        //   `/dashboard/admin/enrollment/biometrics/start/${resumeId}/${data.bioToken}`
        // );
        // return;

        let link = `/dashboard/admin/enrollment/biometrics/start/${resumeId}/${data.bioToken}`;

        if (isStartedOnline) {
          if (isDiplomat) {
            link = `${link}?isRemoteFetch=true&isDiplomat=true`;
          } else {
            link = `${link}?isRemoteFetch=true`;
          }
          return navigate(link);
        } else if (isDiplomat) {
          link = `${link}?isDiplomat=true`;
        }
        return navigate(link);
      }

      await handleStartEnrollment(data.bioToken);

      if (data.message === "Selfie does not match.") {
        setFailed(true);
        toastMessage("error", data.message);
        setLoading(false);
        return;
      }

      toastMessage("success", data.message);
      setFailed(false);
      setCanRessign(false);
    } catch (error: any) {
      console.log(error.code);
      if (
        error?.code === "ERR_NETWORK" ||
        error?.code === "ERR_CONNECTION_REFUSED"
      ) {
        if (!isFallback) {
          console.log("Retry for the first time");
          return retrySelfiePrenrollmentError(image);
        }

        if (isFallback && isFallback && !isFallbackThirdTimes) {
          console.log("Retry for the second time");
          return retrySelfiePrenrollmentError(image, true);
        }
      }

      setLoading(false);
      setFailed(true);
      toastMessage("error", error);
    }
  };

  const retrySelfiePrenrollmentError = async (
    image: string,
    isFallbackThirdTimes?: boolean
  ) => {
    console.warn("Network error, retrying with fallback...");
    await new Promise((resolve) => setTimeout(resolve, 200));
    return verifyPrenrollment(image, true, isFallbackThirdTimes);
  };

  const getSchedules = async () => {
    const options = {
      method: "GET",
      url: `/schedules?offset=0&limit=10&requestNo=${requestNumber}`
    };

    const { data } = await api(options);

    return data;
  };

  const handleStartEnrollment = async (bioToken: string) => {
    if (!prenrollmentId) return;
    const startEnrollment = await onStart({
      preEnrollmentId: prenrollmentId,
      bioToken,
      isStartedOnline,
      payload: {
        isDiplomat
      }
    });

    if (requestNumber) {
      const scheduleData: any = await getSchedules();

      for (let el of scheduleData?.data || scheduleData || []) {
        updateSchedules(el._id, { status: "complete" });
      }
    }

    setLoading(false);

    let link = `/dashboard/admin/enrollment/biometrics/start/${startEnrollment.enrollmentId}/${startEnrollment.bioToken}`;

    if (isStartedOnline) {
      if (isDiplomat) {
        link = `${link}?isRemoteFetch=true&isDiplomat=true`;
      } else {
        link = `${link}?isRemoteFetch=true`;
      }
    } else if (isDiplomat) {
      link = `${link}?isDiplomat=true`;
    }
    navigate(link);
  };

  const videoConstraints = {
    width: 200,
    height: 200,
    // facingMode: "user",
    deviceId: activeDeviceId ? { exact: activeDeviceId.value } : undefined
  };

  const canUseOffline = defineAccess({
    method: "get",
    module: "offline"
  });

  const canUseDiplomat = defineAccess({
    method: "POST",
    module: "diplomat"
  });

  const handleSendDirectOTP = async () => {
    try {
      setSendingDirectOTP(true);
      if (!enrollmentId || !accountId || !image) return;
      const data: any = await pairValidatorDirectSkipRequestCode(
        {
          enrollmentId,
          accountId,
          approverSelfie: image,
          isBioRefresh
        },
        isStartedOnline
      );
      setSendingDirectOTP(false);
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
    } catch (error) {
      toastMessage("error", error);
      setSendingDirectOTP(false);
    }
  };

  const renderSelfie = () => {
    return (
      <div className="rs-modal-body">
        {image ? (
          <center>
            <div>
              <img
                src={image}
                alt="Facial image auth"
                style={{
                  borderRadius: 200,
                  width: 200,
                  height: 200
                }}
              />
            </div>
          </center>
        ) : (
          <div>
            <SelectDropdown
              name="camera"
              options={devices}
              onChange={handleDeviceChange}
              value={activeDeviceId}
              type="object"
              testId="camera"
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div
                style={{
                  borderRadius: 200,
                  overflow: "hidden",
                  width: 200,
                  height: 200
                }}
              >
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  width={200}
                  height={200}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  data-testid="webcam"
                />
              </div>
            </div>
          </div>
        )}
        <br />
        {canUseDiplomat && !isPairValidator && (
          <>
            <List bordered className="mb-2">
              <List.Item>
                <Checkbox
                  label="Diplomat"
                  checked={isDiplomat}
                  onChange={() => setDiplomat(!isDiplomat)}
                  description={translation.diplomat_biometric_photo_only}
                />
              </List.Item>
            </List>
          </>
        )}

        <div>
          <ButtonToolbar>
            {image && !loading ? (
              <Button
                text={translation.retake}
                onClick={() => setImage(null)}
                block
              />
            ) : (
              <Button
                text={translation.take_photo}
                onClick={handleCapture}
                loading={loading}
                block
              />
            )}
            {isFailed && (!isBioRefresh || isPairValidator) && image && (
              <>
                {canUseOffline && isPairValidator ? (
                  <Button
                    text={translation.skip_selfie_verification}
                    onClick={() => handleSendDirectOTP()}
                    loading={isSendingDirectOTP}
                    block
                    appearance="ghost"
                  />
                ) : (
                  <Button
                    text={translation.skip_selfie_verification}
                    onClick={() => setPage(2)}
                    loading={isSkipping}
                    block
                    appearance="ghost"
                  />
                )}
              </>
            )}
            {/* {canRessign && (
              <Button
                text={translation.change_officer}
                onClick={() => setPage(3)}
                appearance="ghost"
                block
              />
            )} */}
            <Button
              text={setActiveIndex ? translation.go_back : translation.close}
              onClick={() =>
                setActiveIndex ? setActiveIndex(prevIndex) : setOpen(false)
              }
              appearance="subtle"
              block
            />
          </ButtonToolbar>
        </div>
      </div>
    );
  };

  const renderPhoneNumber = () => {
    return (
      <Skip
        goBack={() => setPage(1)}
        prenrollmentId={prenrollmentId}
        phoneNumber={phoneNumber}
        preEnrollmentNo={preEnrollmentNo}
        enrollmentId={enrollmentId}
        accountId={accountId}
        image={image}
        isBioRefresh={isBioRefresh}
        email={email || ""}
        isPairValidator={isPairValidator}
        isStartedOnline={isStartedOnline}
      />
    );
  };

  if (page === 1) {
    return renderSelfie();
  }

  if (page === 2) {
    return renderPhoneNumber();
  }

  // if (page === 3) {
  //   return (
  //     <Panel>
  //       <ChangeOfficer
  //         // fetchData={() => onFetchEnrollment()}
  //         enrollmentId={enrollmentId}
  //         accountId={accountId}
  //         // setOfficerModal={setOfficerModal}
  //       />
  //     </Panel>
  //   );
  // }

  return <>Unable to find page</>;
};

export default FacialAuth;
