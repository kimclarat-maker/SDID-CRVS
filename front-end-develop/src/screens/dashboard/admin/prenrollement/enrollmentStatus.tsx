import Button from "@/components/button";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useState } from "react";
import { ButtonToolbar, Heading, Text } from "rsuite";

interface Props {
  status: string;
}

// enrollment_completed

const EnrollmentStatus: React.FC<Props> = ({ status }) => {
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  return (
    <Modal show={open} handleClose={() => setOpen(false)}>
      <Heading>{translation.enrollment_status}</Heading>
      <Text>{translation.enrollment_completed}</Text>
      {status === "enrollment_completed" && (
        <Button text={translation.view_application} />
      )}
      <Button text={translation.close} onClick={() => setOpen(false)} />
    </Modal>
  );
};

export default EnrollmentStatus;
