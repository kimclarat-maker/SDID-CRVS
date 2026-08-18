import { useContext } from "react";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";
import imageSpace from "@/assets/space.png";
import "./styles.css";
import Navbar from "@/components/navbar";

function NotFound() {
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
                      OOOPS!
                      <br />
                      Page Not Found
                    </h1>
                    <p className="mb-3">
                      This page does not exist or removed
                      <br />
                      We suggest you to go back home
                    </p>
                    <Button
                      onClick={() => navigate("/landing")}
                      text={translation.home}
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

export default NotFound;
