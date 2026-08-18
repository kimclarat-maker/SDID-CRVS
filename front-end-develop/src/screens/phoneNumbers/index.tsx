import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { useNavigate, useParams } from "react-router-dom";
import FormLayout from "@/layout/form/formLayout";
import Button from "@/components/button";
import PhoneList from "./phoneList";
import VerificationOptions from "./verificationOptions";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage, setStorage } from "@/utils/storage";
import { sendOTP } from "@/api/otp";
import { MaskedPhoneNumberType } from "@/types/MaskedPhoneNumber";
import { Modal } from "rsuite";
import { goBack } from "@/utils/common/goBack";

const OTPHolder = () => {
  const [maskedPhoneNumbers, setMaskedPhoneNumbers] = useState([]);
  const { translation } = useContext(LanguageContext);
  const [phoneNumber, setPhoneNumber] = useState<MaskedPhoneNumberType | null>(
    null
  );
  const { preEnrollmentTempId } = useParams();

  const [loadingOptions, setLoading] = useState({
    isFetchingPhones: false,
    isSendingOTP: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaskedPhones = async () => {
      const data = await getStorage("maskedPhoneNumbers");
      if (data) {
        setMaskedPhoneNumbers(data);
      }
    };
    fetchMaskedPhones();
  }, []);

  const handleSelect = (phone: MaskedPhoneNumberType) => {
    setPhoneNumber((prev) => (prev?.key === phone.key ? null : phone));
  };

  const handleSendOTP = async () => {
    setLoading((prev) => ({
      ...prev,
      isSendingOTP: true,
    }));

    if (!preEnrollmentTempId)
      return toastMessage("error", translation.applicant_information_missing);

    if (!phoneNumber)
      return toastMessage("error", translation.applicant_information_missing);

    try {
      const data = await sendOTP({
        type: "phone",
        maskedPhoneNumberKey: phoneNumber.key,
        preEnrollmentTempId: preEnrollmentTempId,
      });

      await setStorage(
        { ...phoneNumber, retryIn: data.retryIn / 1000 },
        "phoneNumber"
      );

      toastMessage("success", data.message);
      setLoading((prev) => ({
        ...prev,
        isSendingOTP: false,
      }));
      navigate(`/authentication/phone/${preEnrollmentTempId}`);
    } catch (error) {
      setLoading((prev) => ({
        ...prev,
        isSendingOTP: false,
      }));
    }
  };

  const verificationOptions = [
    {
      name: translation.phone_verification,
      route: `/authentication/phone/${preEnrollmentTempId}`,
      active: true,
      icon: "phone",
    },
    // {
    //   name: translation.email_verification,
    //   route: "/authentication/otp/email",
    //   active: false,
    //   icon: "email",
    // },
    {
      name: translation.answer_secret_questions,
      route: `/authentication/question/${preEnrollmentTempId}`,
      active: false,
      icon: "help",
    },
    // {
    //   name: translation.pki,
    //   route: "/authentication/otp/pki",
    //   active: false,
    // },
  ];

  return (
    <FormLayout
      size={5}
      titleStyle={{ fontSize: 22 }}
      title={`${translation.verify_account}`}
      description={translation.your_phone_numbers_description}
    >
      <div data-testid="list-phone-numbers">
        <PhoneList
          phoneNumbers={maskedPhoneNumbers || []}
          selectedPhoneNumber={phoneNumber}
          onSelect={handleSelect}
          noDataText={translation.no_data}
          noPhoneDescription={
            translation.no_phone_number_available_for_this_applicant
          }
        />
      </div>
      <hr />
      <div data-testid="verification-options">
        <VerificationOptions options={verificationOptions} />
      </div>
      <hr />
      <div data-testid="action-buttons">
        <Modal.Footer>
          <Button
            appearance={"default"}
            text={translation.go_back}
            onClick={() => goBack(navigate)}
            testId="go_back"
          />
          <Button
            text={translation.proceed}
            onClick={handleSendOTP}
            loading={loadingOptions.isSendingOTP}
            disabled={!phoneNumber}
            testId="proceed"
          />
        </Modal.Footer>
      </div>
    </FormLayout>
  );
};

export default OTPHolder;
