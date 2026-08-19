import { ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import Icon from "../icon";
import useCurrentPath from "@/hooks/useCurrentPath";
import { Sidenav as LibSidebar, Nav, Sidenav, Whisper, Tooltip } from "rsuite";
import { SidebarContext } from "@/context/SidebarContext";
import useScreenSize from "@/hooks/useScreenSize";
import { LanguageContext } from "@/context/LanguageContext";
import { FilterContext } from "@/context/FilterContext";
import { defineAccess } from "@/utils/common/permissions";
import NotificationCount from "../notification/count";
import Button from "../button";
import { getStorage } from "@/utils/storage";
import { AccountType } from "@/types/Account";

const MenuItem = ({
  icon,
  name,
  menus,
  bold
}: {
  route: string;
  icon?: string;
  name: string;
  menus?: any;
  count?: any;
  bold?: boolean;
}) => {
  return (
    <>
      {icon && (
        <div className="sidebarMenuIcon">
          <Icon name={icon} />
        </div>
      )}
      <div className="sidebarMenu">
        <span className={bold ? "textBold" : ""}>{name}</span>
      </div>
      {menus?.length > 0 && (
        <div className="menusCollapse">
          <Icon name="keyboard_arrow_up" styles={{ fontSize: 18 }} />
        </div>
      )}
    </>
  );
};

function Sidebar() {
  const { pathname } = useCurrentPath();
  const navigate = useNavigate();
  const { expanded, setSidebarExpand } = useContext(SidebarContext);
  const { isPhone, isTablet } = useScreenSize();
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [user, setUserLoggedIn] = useState<AccountType>({} as AccountType);

  useEffect(() => {
    if (isPhone || isTablet) {
      return setSidebarExpand(false);
    }
    setSidebarExpand(true);

    const getUser = async () => {
      const user = await getStorage();

      setUserLoggedIn(user?.account);
    };

    getUser();
  }, [isPhone, isTablet]);

  type MenuEntry = {
    name: string;
    icon: string;
    route: string;
    menus?: { name: string; route: string; count?: ReactNode }[];
  };

  const menuGroups = [
    {
      label: "Overview",
      items: [
        defineAccess({ method: "get", module: "reports" }) && {
          name: translation.home,
          icon: "grid_view",
          route: "/dashboard/admin/dashboard"
        },
        defineAccess({ method: "get", module: "reports" }) && {
          name: "Analytics",
          icon: "monitoring",
          route: "/dashboard/admin/analytics"
        }
      ]
    },
    {
      label: "Operations",
      items: [
        defineAccess({ method: "get", module: "enrollment" }) && {
          name: translation.enrollments,
          icon: "group",
          route: "/dashboard/admin/enrollment"
        },
        defineAccess({ method: "get", module: "enrollment" }) && {
          name: translation.requests,
          icon: "contract",
          route: "/dashboard/admin/request",
          menus: [
            {
              name: translation.drafts,
              route: "/dashboard/admin/request/drafts",
              count: <NotificationCount type={"DRAFT"} />
            },
            {
              name: translation.pending,
              route: "/dashboard/admin/request/pending",
              count: <NotificationCount type={"PENDING"} />
            },
            {
              name: translation.exceptions,
              route: "/dashboard/admin/request/exceptions",
              count: <NotificationCount type={"EXCEPTIONS"} />
            },
            {
              name: translation.approved,
              route: "/dashboard/admin/request/approved",
              count: <NotificationCount type={"APPROVED"} />
            },
            {
              name: translation.offline,
              route: "/dashboard/admin/request/offline"
            }
          ]
        },
        defineAccess({ method: "get", module: "schedule" }) && {
          name: translation.schedules,
          icon: "calendar_month",
          route: "/dashboard/admin/schedules"
        },
        defineAccess({ method: "get", module: "notifications" }) && {
          name: translation.notifications,
          icon: "notifications",
          route: "/dashboard/admin/notifications"
        }
      ]
    },
    {
      label: "Directory",
      items: [
        defineAccess({ method: "get", module: "centers" }) && {
          name: translation.centers,
          icon: "corporate_fare",
          route: "/dashboard/admin/centers"
        },
        defineAccess({ method: "get", module: "account" }) && {
          name: translation.accounts,
          icon: "account_box",
          route: "/dashboard/admin/accounts"
        },
        defineAccess({ method: "get", module: "supportingdocuments" }) && {
          name: translation.supporting_documents,
          icon: "description",
          route: "/dashboard/admin/supporting-documents"
        },
        defineAccess({ method: "get", module: "deviceManagement" }) && {
          name: translation.devices,
          icon: "devices_fold_2",
          route: "/dashboard/admin/devices"
        },
        defineAccess({ method: "get", module: "geography" }) && {
          name: translation.locations,
          icon: "location_on",
          route: "/dashboard/admin/geography"
        }
      ]
    },
    {
      label: "System",
      items: [
        defineAccess({ method: "get", module: "logs" }) && {
          name: translation.logs,
          icon: "info",
          route: "/dashboard/admin/logs"
        },
        {
          name: translation.settings,
          icon: "settings",
          route: "/dashboard/admin/settings"
        }
      ]
    }
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter(Boolean) as MenuEntry[]
    }))
    .filter((group) => group.items.length > 0);

  const isSmallScreen = isPhone || isTablet;
  const railCollapsed = !isSmallScreen && !expanded;
  const sidenavExpanded = isSmallScreen ? true : expanded;

  const enrollButton = (
    <Button
      text={railCollapsed ? "" : translation.enroll}
      testId="enroll"
      startIcon="add_circle"
      size="lg"
      onClick={() => navigate("/dashboard/admin/prenrollment/search")}
    />
  );

  return (
    <div
      className={`sidebar ${
        isSmallScreen
          ? expanded
            ? "show fixed"
            : "hide"
          : expanded
          ? "show"
          : "collapsed"
      }`}
      id="sidebar"
    >
      <LibSidebar appearance="subtle" expanded={sidenavExpanded}>
        <Sidenav.Header>
          <div
            style={{
              padding: railCollapsed ? "0.75rem" : "1rem 1.25rem",
              display: "flex",
              justifyContent: railCollapsed ? "center" : "stretch",
              borderBottom: "1px solid var(--border-color)"
            }}
          >
            {railCollapsed ? (
              <Whisper
                placement="right"
                trigger="hover"
                speaker={<Tooltip>{translation.enroll}</Tooltip>}
              >
                {enrollButton}
              </Whisper>
            ) : (
              enrollButton
            )}
          </div>
        </Sidenav.Header>
        <Sidenav appearance="subtle" expanded={sidenavExpanded}>
          <Sidenav.Body>
            <Nav activeKey="0" defaultActiveKey="3">
              {menuGroups.map((group, g) => (
                <div key={group.label}>
                  {!railCollapsed && (
                    <div className="sidebarGroupLabel">{group.label}</div>
                  )}
                  {group.items.map((menu, m) => {
                    const eventKey = `${g}-${m}`;
                    const active = menu.route === pathname;

                    if (menu.menus) {
                      return (
                        <Nav.Menu
                          key={eventKey}
                          eventKey={eventKey}
                          title={
                            <>
                              <MenuItem
                                name={menu.name}
                                route={menu.route}
                                bold
                              />
                            </>
                          }
                          icon={<Icon name={menu.icon} />}
                          trigger="hover"
                          placement="rightStart"
                        >
                          {menu.menus.map((subMenu, s) => {
                            const subActive = subMenu.route === pathname;
                            return (
                              <Nav.Item
                                eventKey={`${eventKey}-${s}`}
                                active={subActive}
                                onClick={() => {
                                  // reset previous filters
                                  setFilters({});
                                  if (isPhone || isTablet) {
                                    setSidebarExpand(false);
                                  }
                                  navigate(subMenu.route);
                                }}
                                key={s}
                                style={{ paddingLeft: 65 }}
                              >
                                <div className="d-flex gap-1">
                                  <MenuItem
                                    name={subMenu.name}
                                    route={subMenu.route}
                                  />
                                  {subMenu.count}
                                </div>
                              </Nav.Item>
                            );
                          })}
                        </Nav.Menu>
                      );
                    }
                    return (
                      <Nav.Item
                        key={eventKey}
                        eventKey={eventKey}
                        active={active}
                        icon={<Icon name={menu.icon} />}
                        onClick={() => {
                          // reset previous filters
                          setFilters({});
                          if (isPhone || isTablet) {
                            setSidebarExpand(false);
                          }
                          navigate(menu.route);
                        }}
                      >
                        <MenuItem
                          name={menu.name}
                          route={menu.route}
                          menus={menu.menus}
                          bold
                        />
                      </Nav.Item>
                    );
                  })}
                </div>
              ))}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </LibSidebar>

      {!railCollapsed && user?.firstName && (
        <div className="sidebarUserCard">
          <div className="sidebarUserAvatar">
            {`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()}
          </div>
          <div className="sidebarUserInfo">
            <div className="sidebarUserName">
              {user.firstName} {user.lastName}
            </div>
            <div className="sidebarUserRole">
              {user.accessRole?.name || translation.settings}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
