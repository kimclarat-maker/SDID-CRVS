import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useState } from "react";
import { ButtonToolbar, Heading, Modal, Text } from "rsuite";
import Button from "../button";
import toastMessage from "@/utils/common/toastMessage";
import { userLogoutApi } from "@/api/login";
import { useNavigate } from "react-router-dom";
import { clearStorage } from "@/utils/storage";
import { cfg } from "@/constants/cfg";

type Props = {
  handleClose: () => void;
};

function LogoutConfirm({ handleClose }: Props) {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    try {
      setSubmitting(true);
      await userLogoutApi();

      cfg.VITE_APP_NAME && (await sessionStorage.removeItem(cfg.VITE_APP_NAME));

      onNavigateAndClear();
    } catch (error: any) {
      setSubmitting(false);

      onNavigateAndClear();
    }
  };

  const onNavigateAndClear = async () => {
    setSubmitting(false);

    await clearStorage();

    navigate("/authentication/login");
  };
  return (
    <div className="rs-modal-body">
      <Heading level={4}>{translation.sign_out}</Heading>
      <Text>{translation.confirm_logout}</Text>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <Button
          text={translation.sign_out}
          onClick={handleLogout}
          loading={isSubmitting}
        />
        <Button
          text={translation.cancel}
          onClick={handleClose}
          appearance="default"
        />
      </div>
    </div>
  );
}

export default LogoutConfirm;
