import ReacT from "react";
import logoImage from "@/assets/logo.png";
import "./styles.css";
import Button from "../button";
import { ButtonToolbar } from "rsuite";

interface Props {
  restoreAccess: () => void;
  closeCurrentTab: () => void;
}

const AppAlreadyOpen: React.FC<Props> = ({
  restoreAccess,
  closeCurrentTab,
}) => {
  return (
    <div className="app-already-open">
      <div className="content">
        <img src={logoImage} alt="App Logo" />
        <center>
          <h2>e-INDANGAMUNTU</h2>
          <p style={{ opacity: 0.8, width: "65%", marginTop: ".3rem" }}>
            Already open in another tab or was not closed properly
          </p>
          <br />
          {restoreAccess && (
            <ButtonToolbar
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button onClick={restoreAccess} text="Switch here" />
              <Button
                onClick={closeCurrentTab}
                text="Close"
                appearance="default"
              />
            </ButtonToolbar>
          )}
        </center>
      </div>
    </div>
  );
};

export default AppAlreadyOpen;
