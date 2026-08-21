import { useContext, useEffect, useState } from "react";
import Logo from "./logo";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";
import { LanguageContext } from "@/context/LanguageContext";
import { NavbarType } from "@/types/Navbar";
import { getStorage, setStorage } from "@/utils/storage";
import { UserType } from "@/types/User";

import {
  Dropdown,
  Avatar,
  IconButton,
  Stack,
  Text,
  TagGroup,
  Tag,
} from "rsuite";
import { Navbar as LibNavbar } from "rsuite";
import Button from "../button";
import { translations } from "@/internationalization";
import capitalizeText from "@/utils/common/capitalizeText";
import Icon from "../icon";

import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import useScreenSize from "@/hooks/useScreenSize";
import DropdownButton from "../button/dropdownButton";
import { SidebarContext } from "@/context/SidebarContext";
import Modal from "../Modal";
import LogoutConfirm from "./LogoutConfirm";
import Health from "../health";
import DemoBadge from "../demoBadge";
import {
  currentWorkspaceHomePath,
  shouldShowWorkspaceSelector,
} from "@/utils/workspace";

export default function Navbar({
  containerType,
  toggleSidebarIcon,
  isLocalServiceActive,
  retryLocalService,
  localServiceHealthData,
  networkHealthData,
  isOnline,
}: NavbarType) {
  const navigate = useNavigate();
  const { translation, setLanguage } = useContext(LanguageContext);
  const [user, setUser] = useState<UserType>({
    email: "",
    firstName: "",
    lastName: "",
    token: "",
  });
  const { isPhone, isTablet } = useScreenSize();
  const { expanded, setSidebarExpand } = useContext(SidebarContext);
  const [logoutConfirmModal, setConfirmModal] = useState(false);
  const [openHealthModal, setOpenHealthModal] = useState(false);

  const publicMenus = [
    {
      name: translation?.home,
      route: "/landing#home",
    },
    {
      name: translation?.services,
      route: "/landing#services",
    },
    {
      name: translation?.how_it_works,
      route: "/landing#how-it-works",
    },
  ];

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

  const onScroll = () => {
    const scrollY = window.pageYOffset;
    const navbar = document.getElementById("appNavbar");

    if (navbar && navbar.classList) {
      const navbarClassList = navbar.classList;

      if (scrollY >= 50) {
        navbarClassList.add("navbarFixed");
      } else {
        navbarClassList.remove("navbarFixed");
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial call to set the correct state on mount

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleToggleSidebar = () => {
    setSidebarExpand(!expanded);
  };

  const renderPublicMenus = (isDropdownItem?: boolean) => {
    if (!user?.token) {
      return publicMenus.map((item, i) => {
        if (isDropdownItem) {
          return (
            <Dropdown.Item key={i}>
              <div className="dropdown-list-item">
                <Link to={item.route}>
                  <Text>{item.name}</Text>
                </Link>
              </div>
            </Dropdown.Item>
          );
        }

        return (
          <Stack.Item key={i} className="navbarItem">
            <Link to={item.route}>
              <Text>{item.name}</Text>
            </Link>
          </Stack.Item>
        );
      });
    }
  };

  const renderLanguage = () => {
    return (
      <Stack.Item>
        <DropdownButton
          minWidth="auto"
          appearance="subtle"
          placement="bottomEnd"
          trigger="hover"
          title={
            <div className="d-flex gap-2">
              <Avatar
                size="xs"
                circle
                src={translation.image || userImagePlaceholder}
              >
                {translation.default.charAt(0).toUpperCase()}
              </Avatar>
              {!isPhone && !isTablet && (
                <Text>{capitalizeText(translation.default)}</Text>
              )}
            </div>
          }
        >
          {Object.keys(translations).map((key, i) => {
            return (
              <Dropdown.Item
                key={i}
                onClick={async () => {
                  const lng = translations[key as keyof typeof translations];
                  await setStorage(key, "language");
                  setLanguage(key);
                }}
              >
                <div className="dropdown-list-item">
                  <img
                    src={translations[key as keyof typeof translations].image}
                  ></img>
                  <Text className="textBold">{capitalizeText(key)}</Text>
                </div>
              </Dropdown.Item>
            );
          })}
        </DropdownButton>
      </Stack.Item>
    );
  };

  return (
    <div className="appNavbar noPrint " id="appNavbar">
      <div className={containerType}>
        <div className="navbar-menus-container">
          <Stack wrap spacing={isPhone || isTablet ? 8 : 28}>
            {!user?.token && isPhone && (
              <>
                <Stack.Item>
                  <DropdownButton
                    minWidth="auto"
                    appearance="subtle"
                    placement="bottomStart"
                    title={<Icon name="menu" />}
                    noCaret
                  >
                    {renderPublicMenus(true)}
                  </DropdownButton>
                </Stack.Item>
              </>
            )}
            <Stack.Item>
              <LibNavbar.Brand href="#" className="d-flex gap-4">
                {toggleSidebarIcon && (
                  <IconButton
                    onClick={handleToggleSidebar}
                    icon={<Icon name={toggleSidebarIcon} />}
                    title={
                      expanded ? "Collapse navigation" : "Expand navigation"
                    }
                    aria-label={
                      expanded ? "Collapse navigation" : "Expand navigation"
                    }
                  />
                )}
                <Logo />
              </LibNavbar.Brand>
            </Stack.Item>
            {user?.token && (
              <Stack.Item>
                <DemoBadge />
              </Stack.Item>
            )}
            <Stack.Item grow={1} />
            <>{!isPhone && !isTablet && user?.token && renderPublicMenus()}</>

            {!isPhone && !isTablet && renderLanguage()}

            {user?.token && (
              <>
                <Stack.Item>
                  <IconButton
                    icon={
                      <Icon
                        name={
                          isOnline && isLocalServiceActive
                            ? "database_upload"
                            : isLocalServiceActive
                            ? "database_search"
                            : "database"
                        }
                      />
                    }
                    size="xs"
                    appearance={
                      localServiceHealthData?.status?.toUpperCase() === "UP"
                        ? "primary"
                        : "default"
                    }
                    circle
                    title={`Local Service ${
                      localServiceHealthData?.status?.toUpperCase() || "DOWN"
                    }`}
                    onClick={() => setOpenHealthModal(true)}
                  />
                </Stack.Item>
                {/* <Stack.Item> */}
                {/* <IconButton
                    icon={<Icon name="notifications" />}
                    size="xs"
                    appearance="subtle"
                    circle
                  />
                </Stack.Item> */}

                <Stack.Item>
                  <IconButton
                    icon={<Icon name="help" />}
                    size="xs"
                    appearance="subtle"
                    circle
                    title="Documentation"
                    onClick={() =>
                      window.open("/docs", "_blank", "noopener,noreferrer")
                    }
                  />
                </Stack.Item>
                <Stack.Item>
                  <DropdownButton
                    minWidth="auto"
                    appearance="subtle"
                    title={
                      <div className="d-flex gap-2">
                        <Avatar size="xs" circle src={userImagePlaceholder} />
                        {(!isPhone || !isTablet) && (
                          <Text>
                            {user.firstName} {user.lastName}
                          </Text>
                        )}
                      </div>
                    }
                    noCaret
                    placement="bottomEnd"
                    endIcon="more_vert"
                  >
                    <Dropdown.Item panel style={{ padding: 10 }}>
                      <Text>{translation.signin_as}</Text>
                      <Text className="textBold">
                        {user.firstName} {user.lastName}
                      </Text>
                      <TagGroup>
                        <Tag>{user.accountType}</Tag>
                      </TagGroup>
                    </Dropdown.Item>
                    <Dropdown.Separator />
                    <Dropdown.Item
                      onClick={() => navigate(currentWorkspaceHomePath())}
                    >
                      <div className="d-flex gap-2">
                        <Icon name="dashboard" />
                        {translation.dashboard}
                      </div>
                    </Dropdown.Item>
                    {shouldShowWorkspaceSelector() && (
                      <Dropdown.Item
                        onClick={() => navigate("/dashboard/workspaces")}
                        data-testid="switch-workspace"
                      >
                        <div className="d-flex gap-2">
                          <Icon name="swap_horiz" />
                          Switch workspace
                        </div>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={() => setConfirmModal(true)}>
                      <div className="d-flex gap-2">
                        <Icon name="logout" />
                        {translation.sign_out}
                      </div>
                    </Dropdown.Item>
                  </DropdownButton>
                </Stack.Item>
              </>
            )}
          </Stack>
        </div>
      </div>

      <Modal
        show={logoutConfirmModal}
        handleClose={() => setConfirmModal(false)}
      >
        <LogoutConfirm handleClose={() => setConfirmModal(false)} />
      </Modal>

      <Modal
        show={openHealthModal}
        handleClose={() => setOpenHealthModal(false)}
        title={translation.local_database_health_network_status}
      >
        <Health
          isOnline={isOnline || false}
          isLocalServiceActive={isLocalServiceActive || false}
          retryLocalService={retryLocalService}
          localServiceHealthData={localServiceHealthData}
          showMore={true}
          closeModal={() => setOpenHealthModal(false)}
        />
      </Modal>
    </div>
  );
}
