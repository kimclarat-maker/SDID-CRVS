import Button from "@/components/button";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { EnrollmentType } from "@/types/Enrollment";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ButtonToolbar, Heading, Text } from "rsuite";

interface Props {
  data: EnrollmentType;
  open: boolean;
  setOpen: (b: boolean) => void;
  id: string;
}

const Happypath: React.FC<Props> = ({ open, setOpen, data, id }) => {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  return (
    <Modal show={open} handleClose={() => setOpen(false)} size="sm">
      <Heading level={4}>
        <Text className="textPrimary">{data.preEnrollmentNumber}</Text>
      </Heading>
      <br />
      <Text>{translation.biometric_were_captured_successfully}</Text>
      <br />
      <ButtonToolbar>
        <Button
          text={translation.yes}
          onClick={() => navigate(`/dashboard/admin/enrollment/${id}`)}
          styles={{ minWidth: 80 }}
        />
        <Button
          text={translation.no}
          onClick={() => navigate(`/dashboard/admin/enrollment/${id}`)}
          appearance="default"
          styles={{ minWidth: 80 }}
        />
      </ButtonToolbar>
    </Modal>
  );
};

export default Happypath;
