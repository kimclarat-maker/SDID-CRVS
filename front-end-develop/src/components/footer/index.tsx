import { useContext } from "react";
import "./styles.css";
import { LanguageContext } from "@/context/LanguageContext";
import LOGO from "@/assets/logo.svg";
import Icon from "../icon";
import useScreenSize from "@/hooks/useScreenSize";
import { platformConfig } from "@/config/platform.config";

const Footer = () => {
  const { translation } = useContext(LanguageContext);
  const { isPhone, isTablet } = useScreenSize();
  return (
    <div className="footer" data-testid="footer-section">
      <div className="container">
        <div>
          <small className="textBold">
            {translation.default === "English" ? (
              <>
                {translation.all_right_reserved} &copy;{" "}
                {new Date().getFullYear()}
              </>
            ) : (
              <>
                &copy; {platformConfig.platformShortName}{" "}
                {new Date().getFullYear()}
              </>
            )}
          </small>
        </div>
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ flex: 1 }}
        >
          <center>
            <div className="logoContainer">
              <img src={LOGO} />
            </div>
            {(!isPhone || !isTablet) && (
              <span className="textBold">
                {platformConfig.platformShortName}
              </span>
            )}
          </center>
        </div>
        {platformConfig.contact.callCenterNumber && (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Icon
              name="call"
              styles={{ fontSize: 16, color: "var(--rs-primary)" }}
            />{" "}
            <small className="textBold">
              {(!isTablet || !isPhone) && translation.call_center}{" "}
              {platformConfig.contact.callCenterNumber}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Footer;
