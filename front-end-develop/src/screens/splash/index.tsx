import { getStorage } from "@/utils/storage";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles.css";
import logoImage from "@/assets/logo.png";
import toastMessage from "@/utils/common/toastMessage";
import { platformConfig } from "@/config/platform.config";

function SplashScreen({ firstLoad }: { firstLoad?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUserLoggedInInfo = async () => {
      try {
        if (!firstLoad) return navigate(location.pathname, { replace: true });
        const user = await getStorage();

        if (!user || !user?.token) {
          navigate("/");

          return;
        }

        navigate("/dashboard/admin");
      } catch (error) {
        toastMessage("error", error);
      }
    };

    setTimeout(() => {
      getUserLoggedInInfo();
    }, 1500);
  }, [navigate]);

  return (
    <div className="splashContainer">
      <div className="logoLoading">
        <img src={logoImage} />
        <span>
          <span className="textBold">{platformConfig.platformShortName}</span>
        </span>
      </div>
    </div>
  );
}

export default SplashScreen;
