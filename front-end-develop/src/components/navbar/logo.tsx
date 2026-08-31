import logoImage from "@/assets/logo.svg";
import { useNavigate } from "react-router-dom";

import "./styles.css";
import { Text } from "rsuite";
import useScreenSize from "@/hooks/useScreenSize";
import { useEffect, useState } from "react";
import { UserType } from "@/types/User";
import { getStorage } from "@/utils/storage";

export default function Logo() {
  const navigate = useNavigate();
  const { isPhone, isTablet } = useScreenSize();
  const [user, setUser] = useState<UserType>({
    email: "",
    firstName: "",
    lastName: "",
    token: "",
  });

  useEffect(() => {
    const fetchUserLoggedIn = async () => {
      try {
        const userLoggedIn = await getStorage();
        setUser(userLoggedIn);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserLoggedIn();
  }, []);

  return (
    <div onClick={() => navigate("/")} className="navbarLogo">
      {(!isPhone || !isTablet) && (
        <>
          <img src={logoImage} alt="App Logo" />
          <Text className="appName">
            <span className="textBold">SDID</span> <span>ENROLLMENT</span>
          </Text>
        </>
      )}
    </div>
  );
}
