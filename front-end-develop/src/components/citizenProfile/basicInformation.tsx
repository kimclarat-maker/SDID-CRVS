import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import React, { useContext, useEffect, useMemo, useState } from "react";
import userPhotoPlaceholder from "@/assets/userPhotoPlaceholder.png";
import { RollBack } from "@/types/RollBack";
import { Prenrollment } from "@/types/Prenrollment";
import { formateNationality } from "@/utils/common/countryNameFormat";
import Button from "../button";
import Modal from "../Modal";
import OTPCodeForm from "../forms/login/otp-code";
import { DescriptionItem, DescriptionList } from "../descriptionList";
import { useFormik } from "formik";
import { OTPType } from "@/types/OTP";
import { otpValidationSchema } from "@/validation/otp.validation";
import toastMessage from "@/utils/common/toastMessage";
import { isUUID } from "@/utils/common/uuid";
import { getMediaById } from "@/api/media";

interface Props {
  data: EnrollmentType | RollBack | Prenrollment;
}

const BasicInformation: React.FC<Props> = ({ data }) => {
  const { translation } = useContext(LanguageContext);
  const [openOTPModal, setOpenOTPModal] = useState(false);
  const [isUpdatingPhone, setUpdatingPhone] = useState(false);
  const validationSchema = useMemo(
    () => otpValidationSchema(translation),
    [translation]
  );
  const [bioPhoto, setBioPhoto] = useState("");

  const displayFace = () => {
    try {
      const face =
        "biometric" in data && data.biometric?.face
          ? data?.biometric?.face?.preview?.startsWith("{")
            ? JSON.parse(data?.biometric?.face?.preview || "")
            : data?.biometric?.face?.preview || data?.biometric?.face?.face
          : null;

      return face?.photo || face;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const getFace = async () => {
      try {
        const face =
          "biometric" in data && data.biometric?.face
            ? displayFace()
            : data?.selfie && data?.selfie !== ""
            ? data.selfie
            : userPhotoPlaceholder;

        if (isUUID(face)) {
          const image = await getMediaById({ mediaId: face });
          setBioPhoto(`data:image/jpeg;base64,${image}`);
        } else {
          setBioPhoto(face);
        }
      } catch (error) {
        console.log("error", error);
      }
    };
    getFace();
  }, [data]);

  const formik = useFormik<OTPType>({
    initialValues: {
      code: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        toastMessage("success", "Phone number has been updated successfully");
        setOpenOTPModal(false);
        formik.resetForm();
      } catch (error) {
        toastMessage("error", error);
      }
    },
    enableReinitialize: true,
  });

  if (!data) return null;

  const isApproved = data?.status?.toUpperCase() === "APPROVED";

  return (
    <div className="row">
      <div className="col-md-8">
        <DescriptionList columns={3}>
          <DescriptionItem label={translation.surname} value={data?.firstName} />
          <DescriptionItem
            label={translation.post_name}
            value={data?.lastName}
          />
          <DescriptionItem label={translation.dob} value={data?.dob} />
          <DescriptionItem label={translation.gender} value={data?.gender} />
          <DescriptionItem
            label={translation.marital_status}
            value={data?.maritalStatus}
          />
          <DescriptionItem
            label={translation.nationality}
            value={formateNationality(data?.nationality)}
          />
          <DescriptionItem
            label={translation.other_nationality}
            value={formateNationality(data?.otherNationality)}
          />
          <DescriptionItem
            label={translation.place_of_birth}
            value={data?.placeOfBirth}
          />
          {data?.email && (
            <DescriptionItem label={translation.email} value={data?.email} />
          )}
          {data?.phoneNumber && (
            <DescriptionItem
              label={translation.phone_number}
              value={
                <div className="d-flex align-items-center gap-2">
                  <span>{data?.phoneNumber}</span>
                  {!isApproved && (
                    <Button
                      startIcon="edit"
                      size="xs"
                      appearance="subtle"
                      loading={isUpdatingPhone}
                      testId="edit-phone-number"
                      onClick={() => {
                        setUpdatingPhone(true);
                        setTimeout(() => {
                          setUpdatingPhone(false);

                          setOpenOTPModal(true);
                        }, 2000);
                      }}
                    />
                  )}
                </div>
              }
            />
          )}
        </DescriptionList>
      </div>

      <div className="col-md-4">
        <div className="citizen-img">
          <img src={bioPhoto} alt="Citizen Profile image" />
        </div>
      </div>

      <Modal show={openOTPModal} handleClose={() => setOpenOTPModal(false)}>
        <OTPCodeForm {...formik} />
      </Modal>
    </div>
  );
};

export default BasicInformation;
