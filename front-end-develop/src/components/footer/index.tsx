import { useContext } from "react";
import "./styles.css";
import { LanguageContext } from "@/context/LanguageContext";
import LOGO from "@/assets/logo.png";
import Icon from "../icon";
import useScreenSize from "@/hooks/useScreenSize";

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
              <>&copy; SDID NIDA {new Date().getFullYear()}</>
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
              <span className="textBold">NIDA SDID</span>
            )}
          </center>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon
            name="call"
            styles={{ fontSize: 16, color: "var(--rs-primary)" }}
          />{" "}
          <small className="textBold">
            {(!isTablet || !isPhone) && translation.call_center} 3500
          </small>
        </div>
      </div>
    </div>
  );
};

export default Footer;
