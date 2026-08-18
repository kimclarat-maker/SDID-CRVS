import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";
import CustomTabs from "@/components/tabs";
import Selfie from "./selfie";
import Iris from "./iris";
import Fingerprint from "./fingerprint";
import Signature from "./signature";
import Card from "@/components/card";
import { useParams, useSearchParams } from "react-router-dom";
import Empty from "@/components/empty";
import { useFetchEnrollmentById } from "@/hooks/useFetchEnrollments";
import { calculateAge } from "@/utils/common/age";
import Loading from "@/components/loader";
import { useFetchDevices } from "@/hooks/useDevices";
import { getStorage } from "@/utils/storage";

interface Props {
  enableCapture: boolean;
  setOpen?: (b: boolean) => void;
  defaultTab?: string;
  isBioRefresh?: boolean;
  isStartedOnline?: boolean;
}

const StartCaptureBiometrics = ({
  enableCapture,
  setOpen,
  defaultTab,
  isBioRefresh,
  isStartedOnline
}: Props) => {
  const { translation } = useContext(LanguageContext);
  const { id, token } = useParams();
  const [tab, setTab] = useState(defaultTab || "photo");
  const [age, setAge] = useState(0);
  const [updatedBioData, setUpdatedBioData] = useState<any>({});

  const [searchParams] = useSearchParams();
  let isDiplomat: any = searchParams.get("isDiplomat");

  const {
    loading,
    fetchEnrollmentData,
    data: enrollmentData
  } = useFetchEnrollmentById();

  const {
    data: assignedDevices,
    fetchDeviceData,
    loading: loadingDevice
  } = useFetchDevices();

  const fetchDevices = async () => {
    const user = await getStorage();

    fetchDeviceData({
      offset: 0,
      limit: 10,
      accountId: user?.account?._id
    });
  };

  useEffect(() => {
    if (!enableCapture) return;

    fetchDevices();
  }, [enableCapture]);

  useEffect(() => {
    if (!id) return;
    fetchEnrollmentData(id, isStartedOnline);
  }, [id]);

  useEffect(() => {
    if (enrollmentData && enrollmentData.dob) {
      const age = enrollmentData.age
        ? typeof enrollmentData.age === "string"
          ? Number(enrollmentData.age)
          : enrollmentData.age
        : calculateAge(enrollmentData.dob);

      setAge(age);
    }

    if (
      Object.keys(enrollmentData || {}).includes("isDiplomat") &&
      enrollmentData?.isDiplomat
    ) {
      isDiplomat = enrollmentData?.isDiplomat;
    }
  }, [enrollmentData]);

  const getDeviceSerialNumber = (type: string) => {
    const device = assignedDevices.find((d) => d.deviceType === type);
    return device?.serialNumber;
  };

  if (loading || loadingDevice) return <Loading isFullScreen />;

  if (!id) return <Empty title={`${translation.missing_field}: id=${id}`} />;

  if (!enrollmentData?._id && !loading)
    return (
      <Empty
        title={`${translation.no_data_found}`}
        description={translation.enrollment_not_found}
      />
    );

  return (
    <div className="row">
      <div className="col-md-12">
        <Card
        // header={
        //   <Text className="textPrimary textBold">
        //     {translation.biometric_capture}
        //   </Text>
        // }
        >
          <CustomTabs
            activeTab={tab}
            getTab={(t: string) => setTab(t)}
            navigationDisabled
            getKey={(n: number) => setTab(n + "")}
            options={[
              {
                title: translation.photo,
                key: "photo",
                data: (
                  <>
                    <Selfie
                      setTab={setTab}
                      nextTab="iris"
                      enrollmentId={id}
                      enableCapture={enableCapture && tab === "photo"}
                      isBioRefresh={!!isBioRefresh}
                      bioRefreshToken={token}
                      age={age}
                      enrollmentData={enrollmentData}
                      deviceSerialNumber={getDeviceSerialNumber("FACE")}
                      activeTab={tab}
                      setUpdatedBioData={setUpdatedBioData}
                      updatedBioData={updatedBioData}
                      isDiplomat={
                        isDiplomat || isDiplomat === "true" ? true : false
                      }
                    />
                  </>
                )
              },
              age >= 5 &&
                (!isDiplomat || isDiplomat !== "true") && {
                  title: translation.iris,
                  key: "iris",
                  data: (
                    <Iris
                      setTab={setTab}
                      nextTab="fingerprint"
                      activeTab={tab}
                      enrollmentId={id}
                      enableCapture={enableCapture && tab === "iris"}
                      isBioRefresh={!!isBioRefresh}
                      bioRefreshToken={token}
                      enrollmentData={enrollmentData}
                      deviceSerialNumber={getDeviceSerialNumber("IRIS")}
                      setUpdatedBioData={setUpdatedBioData}
                    />
                  )
                },
              age >= 5 &&
                (!isDiplomat || isDiplomat !== "true") && {
                  title: translation.fingerprint,
                  key: "fingerprint",
                  data: (
                    <Fingerprint
                      nextTab="signature"
                      setTab={setTab}
                      enrollmentId={id}
                      enableCapture={enableCapture && tab === "fingerprint"}
                      activeTab={tab}
                      isBioRefresh={!!isBioRefresh}
                      bioRefreshToken={token}
                      age={age}
                      enrollmentData={enrollmentData}
                      deviceSerialNumber={getDeviceSerialNumber("FINGERPRINT")}
                      setUpdatedBioData={setUpdatedBioData}
                      updatedBioData={updatedBioData}
                      fetchDevice={fetchDevices}
                      loadingDevice={loadingDevice}
                    />
                  )
                },
              age >= 16 &&
                (!isDiplomat || isDiplomat !== "true") && {
                  title: translation.signature,
                  key: "signature",
                  data: (
                    <Signature
                      activeTab="signature"
                      enrollmentId={id}
                      setTab={setTab}
                      enableCapture={enableCapture && tab === "signature"}
                      setOpen={setOpen || (() => {})}
                      isBioRefresh={!!isBioRefresh}
                      bioRefreshToken={token}
                      age={age}
                      enrollmentData={enrollmentData}
                      deviceSerialNumber={getDeviceSerialNumber("SIGNATURE")}
                      who={`${enrollmentData?.firstName} ${enrollmentData?.lastName}`}
                      setUpdatedBioData={setUpdatedBioData}
                      updatedBioData={updatedBioData}
                    />
                  )
                }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default StartCaptureBiometrics;
