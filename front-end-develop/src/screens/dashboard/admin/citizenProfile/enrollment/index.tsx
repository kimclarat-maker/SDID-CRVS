import { useContext, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import {
  useFetchEnrollmentById,
  useFetchEnrollments
} from "@/hooks/useFetchEnrollments";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Loading from "@/components/loader";
import Empty from "@/components/empty";
import Header from "../../../../../components/profile/header";
import Identifiation from "@/components/citizenProfile/identification";
import {
  ButtonToolbar,
  PanelGroup,
  Text,
  Heading,
  IconButton,
  Stack
} from "rsuite";
import BasicInformation from "@/components/citizenProfile/basicInformation";
import ResidentialAddress from "@/components/citizenProfile/residentialAddress";
import Parent from "@/components/citizenProfile/parent";
import Spouse from "@/components/citizenProfile/spouse";
import Button from "@/components/button";
import Modal from "@/components/Modal";
import { BioDataContext } from "@/context/BioCapture";
import { goBack } from "@/utils/common/goBack";
import Icon from "@/components/icon";
import Biometrics from "../../biometrics/biometricCapture";
import Card from "@/components/card/PanelCard";
import FacialAuth from "@/components/facialAuth";
import { calculateAge } from "@/utils/common/age";
import { deleteData, manualSyncApiHandler, pushBiometricRefreshToCore, pushToSdidCore } from "@/api/enrollments";
import toastMessage from "@/utils/common/toastMessage";
import { defineAccess } from "@/utils/common/permissions";
import api from "@/api";
import { getStorage } from "@/utils/storage";
import Rollback from "./rollback";

type AlertContentType = {
  title: string;
  description: string;
};

function EnrollmentProfile({
  type = "normal",
  preEnrollmentNumber
}: {
  type: string;
  preEnrollmentNumber?: string;
}) {
  const { translation } = useContext(LanguageContext);
  const { setBioData } = useContext(BioDataContext);
  const { data, loading, fetchEnrollmentData } = useFetchEnrollmentById();
  const { fetchEnrollmentData: fetchByPrEnrollmentNumber } =
    useFetchEnrollments();
  const { id } = useParams();
  const [bioTab, setBioTab] = useState("selfie");
  const [openAlert, setOpenAlert] = useState(false);
  const [alertContent, setAlertContent] = useState<AlertContentType>(
    {} as AlertContentType
  );
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [openFacialAuth, setOpenFacialAuth] = useState(false);
  const [age, setAge] = useState(0);
  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isStartedOnline") === "true";
  const [isSendingSMS, setSendSMS] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [pushingToCore, setPushingToCore] = useState(false);
  const [pushingBioRefresh, setPushingBioRefresh] = useState(false);
  const [rollbackModal, setOpenRollbackModal] = useState(false);

  const renderEmptyState = () => {
    return <Empty title={translation.no_data_found_description} />;
  };

  const fetchData = () => {
    if (id) {
      fetchEnrollmentData(id, isStartedOnline);

      return;
    }

    if (preEnrollmentNumber) {
      fetchByPrEnrollmentNumber(
        { preEnrollmentNo: preEnrollmentNumber },
        isStartedOnline ? "ONLINE" : undefined
      );
    }

    renderEmptyState();
  };

  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getStorage();
      setLoggedInUser(user);
    };

    getUserInfo();
    fetchData();
  }, [id]);

  useEffect(() => {
    if (data) {
      const age = calculateAge(data.dob);
      setAge(age);
    }
  }, [age, data]);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setBioData(data[0]);
      return;
    }
    setBioData(data);
  }, [data]);

  const onDelete = async (id: string) => {
    if (!id) return;

    if (window.confirm(translation.delete_confirmation)) {
      try {
        const data = await deleteData(id);
        toastMessage("success", data.message);

        fetchData();
        goBack(navigate);
      } catch (error) {
        toastMessage("error", error);
      }
    }
  };

  const canDelete = defineAccess({
    method: "delete",
    module: "enrollment"
  });

  const sendENSMS = async () => {
    try {
      setSendSMS(true);

      const options = {
        method: "POST",
        url: `/enrollment/${id}/send-approval-notification`
      };
      const { data } = await api(options);
      if (data?.data?.isSmsSent || data?.data?.isEmailSent) {
        toastMessage("success", data?.message);
      }

      setSendSMS(false);
    } catch (error) {
      toastMessage("error", error);
      setSendSMS(true);
    }
  };

  const onManualSync = async () => {
    try {
      setSyncing(true);
      const { data } = await manualSyncApiHandler();
      setSyncing(false);
      toastMessage("success", data?.message);
    } catch (error) {
      toastMessage("error", error);
      setSyncing(false);
    }
  };

  const onPushToSdidCore = async () => {
    try {
      setPushingToCore(true);
      const result = await pushToSdidCore(data._id);
      toastMessage("success", result?.message || translation.synced_to_core);
      fetchData();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Push to SDID Core failed";
      toastMessage("error", msg);
    } finally {
      setPushingToCore(false);
    }
  };

  const onPushBiometricRefresh = async () => {
    try {
      setPushingBioRefresh(true);
      const result = await pushBiometricRefreshToCore(data._id);
      toastMessage("success", result?.message || "Biometric refresh submitted to SDID Core");
      fetchData();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Biometric refresh push failed";
      toastMessage("error", msg);
    } finally {
      setPushingBioRefresh(false);
    }
  };

  if (loading) {
    return <Loading isFullScreen />;
  }

  if (Object.keys(data).length === 0) {
    return renderEmptyState();
  }

  return (
    <>
      <>
        <Stack spacing={16}>
          <Stack.Item grow={1}>
            <ButtonToolbar>
              <IconButton
                text={translation.go_back}
                onClick={() => goBack(navigate)}
                appearance="default"
                icon={<Icon name="arrow_back" />}
              />
              <Button
                text={translation.photo}
                onClick={() => {
                  setBioTab("photo");
                  setOpenModal(true);
                  setTitle(translation.photo);
                }}
                appearance="ghost"
              />
              <>
                <Button
                  text={translation.iris}
                  onClick={() => {
                    setBioTab("iris");
                    setOpenModal(true);
                    setTitle(translation.iris);
                  }}
                  appearance="ghost"
                />
                <Button
                  text={translation.fingerprint}
                  onClick={() => {
                    setBioTab("fingerprint");
                    setOpenModal(true);
                    setTitle(translation.fingerprint);
                  }}
                  appearance="ghost"
                />
              </>
              <Button
                text={translation.signature}
                onClick={() => {
                  setBioTab("signature");
                  setOpenModal(true);
                  setTitle(translation.signature);
                }}
                appearance="ghost"
              />
            </ButtonToolbar>
          </Stack.Item>
          {data.status?.toUpperCase() === "PENDING" ? (
            <Stack.Item>
              <Button
                text={translation.resume}
                onClick={() =>
                  navigate(
                    `/dashboard/admin/enrollment/biometrics/start/${data._id}`
                  )
                }
              />
            </Stack.Item>
          ) : (
            data.status.toUpperCase() === "APPROVED" && (
              <Stack.Item>
                <ButtonToolbar>
                  {data.syncedToCentral && (
                    <Button
                      text={translation.send_sms}
                      loading={isSendingSMS}
                      onClick={sendENSMS}
                      appearance="ghost"
                    />
                  )}
                  <Button
                    text={translation.bio_refresh}
                    onClick={setOpenFacialAuth}
                  />
                </ButtonToolbar>
              </Stack.Item>
            )
          )}

          {data?.syncSource === "OFFLINE_CENTER" &&
            data?.officer?.idNumber === loggedInUser?.account?.idNumber && (
              <Stack.Item>
                <ButtonToolbar>
                  <Button
                    text={translation.synd_to_central}
                    onClick={() => onManualSync()}
                    appearance="ghost"
                    loading={syncing}
                  />
                </ButtonToolbar>
              </Stack.Item>
            )}
          <Stack.Item>
            <Button
              text={translation.roll_back}
              onClick={() => setOpenRollbackModal(true)}
              appearance="ghost"
            />
          </Stack.Item>
          {/* Push to SDID Core — only for approved enrollments not yet synced */}
          {data.status?.toUpperCase() === "APPROVED" &&
            !data.syncedToCore && (
              <Stack.Item>
                <ButtonToolbar>
                  <Button
                    text={translation.push_to_sdid_core}
                    onClick={onPushToSdidCore}
                    appearance="ghost"
                    loading={pushingToCore}
                  />
                </ButtonToolbar>
              </Stack.Item>
            )}
          {/* Push Biometric Refresh to SDID Core — for approved enrollments already synced */}
          {data.status?.toUpperCase() === "APPROVED" &&
            data.syncedToCore && (
              <Stack.Item>
                <ButtonToolbar>
                  <Button
                    text={translation.push_biometric_refresh}
                    onClick={onPushBiometricRefresh}
                    appearance="ghost"
                    loading={pushingBioRefresh}
                  />
                </ButtonToolbar>
              </Stack.Item>
            )}
        </Stack>
      </>
      <br />
      <Header
        preEnrollmentNumber={data.preEnrollmentNumber}
        enrollmentStatus={data.status}
        enrollmentNumber={data.enrollmentNumber}
        preEnrollmentId={data.preEnrollmentDate}
        phoneNumber={data.phoneNumber}
        enrollmentId={id}
        biometricCaptureDate={data?.biometricCaptureDate}
        enableHeader
        photo={data.selfie}
        syncedToCentral={data.syncedToCentral}
        showManualSendEN
        sdidCoreStatus={data.sdidCoreStatus}
        syncedToCore={data.syncedToCore}
      />
      <br />
      <PanelGroup accordion defaultActiveKey="basic_information">
        {data.enrollmentNumber && data.enrollmentNumber === "" && (
          <Card title="identification_number" eventKey="identification_number">
            <Identifiation enrollmentNumber={data.enrollmentNumber} />
          </Card>
        )}

        <Card title="basic_information" eventKey="basic_information">
          <BasicInformation data={data} />
        </Card>
        <Card title="residential_address" eventKey="residential_address">
          <ResidentialAddress data={data} />
        </Card>
        <Card title="parent_information" eventKey="parent_information">
          <Parent data={data} />
        </Card>
        <Card title="spouse_information" eventKey="spouse_information">
          <Spouse data={data} />
        </Card>
      </PanelGroup>
      <ButtonToolbar>
        {type === "bioRefresh" ? (
          <>
            <Button
              text={translation.approve}
              onClick={() => {
                setAlertContent({
                  title: translation.approve,
                  description: translation.approve_bio
                });
                setOpenAlert(true);
              }}
            />
          </>
        ) : type === "newBiometricCapture" ? (
          <>
            <Button
              text={translation.approve}
              onClick={() => navigate(`/biometric-capture/${id}`)}
            />
            <Button
              text={translation.roll_back}
              onClick={() => {
                setAlertContent({
                  title: translation.approve,
                  description: translation.approve_bio
                });
              }}
              appearance="ghost"
            />
          </>
        ) : data.status === "APPROVED" && canDelete ? (
          <>
            <Button
              text={translation.delete}
              onClick={() => {
                onDelete(data._id);
              }}
              appearance="primary"
              color="red"
            />
          </>
        ) : null}
      </ButtonToolbar>

      <Modal show={openAlert} handleClose={() => setOpenAlert(false)} size="sm">
        <Heading level={4}>
          <Text className="textPrimary">{alertContent.title}</Text>
        </Heading>
        <br />
        <Text>{alertContent.description}</Text>
        <br />
        <ButtonToolbar>
          <Button
            text={translation.yes}
            onClick={() => {
              setBioTab("photo");
              setOpenModal(true);
              setOpenAlert(false);
            }}
            styles={{ minWidth: 80 }}
          />
          <Button
            text={translation.no}
            onClick={() => setOpenAlert(false)}
            appearance="default"
            styles={{ minWidth: 80 }}
          />
        </ButtonToolbar>
      </Modal>

      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        size="lg"
        title={translation.biometrics}
      >
        <Biometrics
          enableCapture={false}
          setOpen={setOpenModal}
          defaultTab={bioTab}
          isStartedOnline={isStartedOnline}
        />
      </Modal>

      <Modal
        show={openFacialAuth}
        handleClose={() => setOpenFacialAuth(false)}
        size="xs"
      >
        <FacialAuth
          setOpen={setOpenFacialAuth}
          phoneNumber={data.phoneNumber}
          enrollmentId={data._id}
          preEnrollmentNo={data.preEnrollmentNumber}
          prenrollmentId={data.preEnrollmentId}
          isBioRefresh
          isInitial
          photo={data.selfie}
        />
      </Modal>

      {rollbackModal && id && (
        <Rollback
          openModal={rollbackModal}
          setOpenModal={(b) => setOpenRollbackModal(b)}
          id={id}
        />
      )}
    </>
  );
}

export default EnrollmentProfile;
