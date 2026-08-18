import { useContext } from "react";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import imageSpace from "@/assets/no-internet.png";
import "./styles.css";
import Navbar from "@/components/navbar";
import { goBack } from "@/utils/common/goBack";

function NoInternet() {
  const { translation } = useContext(LanguageContext);
  const navigate = useNavigate();
  return (
    <>
      <Navbar containerType="container" />
      <div className="notFoundContainer">
        <div className="container">
          <div className="col-md-8 mx-auto">
            <div className="row">
              <div className="col-md-6">
                <div className="notFoundDescription">
                  <div>
                    <h1 className="mb-3">
                      {translation.no_internet_connection}
                    </h1>
                    <p className="mb-3">
                      {translation.no_internet_connection_description}
                      <br />
                    </p>
                    <Button
                      onClick={() => goBack(navigate)}
                      text={translation.try_again}
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="notFoundImage">
                  <img src={imageSpace} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NoInternet;
