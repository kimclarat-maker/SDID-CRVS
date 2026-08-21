import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidenav as LibSidebar, Nav, Sidenav } from "rsuite";
import Icon from "@/components/icon";
import useScreenSize from "@/hooks/useScreenSize";
import { SidebarContext } from "@/context/SidebarContext";
import { CRVS_PERMISSIONS } from "@/constants/crvsRoles";
import { hasWorkspacePermission } from "@/utils/workspace";
import "@/components/sidebar/styles.css";

type CrvsMenuItem = {
  name: string;
  icon: string;
  route: string;
};

export default function CrvsSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { expanded, setSidebarExpand } = useContext(SidebarContext);
  const { isPhone, isTablet } = useScreenSize();

  useEffect(() => {
    if (isPhone || isTablet) {
      setSidebarExpand(false);
      return;
    }
    setSidebarExpand(true);
  }, [isPhone, isTablet]);

  const menus: CrvsMenuItem[] = [
    { name: "Home", icon: "dashboard", route: "/dashboard/crvs" },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_VIEW)) && {
      name: "Birth notifications",
      icon: "campaign",
      route: "/dashboard/crvs/births",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE) && {
      name: "New notification",
      icon: "add_circle",
      route: "/dashboard/crvs/births/new",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EVIDENCE_REVIEW) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)) && {
      name: "Review queue",
      icon: "fact_check",
      route: "/dashboard/crvs/births/review",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_RESPOND) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_REQUEST)) && {
      name: "Corrections",
      icon: "edit_note",
      route: "/dashboard/crvs/corrections",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EXCEPTIONS_VIEW) && {
      name: "Exceptions",
      icon: "warning",
      route: "/dashboard/crvs/exceptions",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANALYTICS_VIEW) && {
      name: "Reports",
      icon: "insights",
      route: "/dashboard/crvs/reports",
    },
  ].filter(Boolean) as CrvsMenuItem[];

  const isSmallScreen = isPhone || isTablet;
  const sidenavExpanded = isSmallScreen ? true : expanded;

  return (
    <div
      className={`sidebar ${
        isSmallScreen ? (expanded ? "show fixed" : "hide") : expanded ? "show" : "collapsed"
      }`}
      id="sidebar"
    >
      <LibSidebar appearance="subtle" expanded={sidenavExpanded}>
        <Sidenav appearance="subtle" expanded={sidenavExpanded}>
          <Sidenav.Body>
            <Nav>
              {menus.map((menu, m) => (
                <Nav.Item
                  key={m}
                  eventKey={`${m}`}
                  active={menu.route === pathname}
                  icon={<Icon name={menu.icon} />}
                  onClick={() => {
                    if (isPhone || isTablet) setSidebarExpand(false);
                    navigate(menu.route);
                  }}
                >
                  <span className="sidebarMenu">
                    <span className="textBold">{menu.name}</span>
                  </span>
                </Nav.Item>
              ))}
            </Nav>
          </Sidenav.Body>
        </Sidenav>
      </LibSidebar>
    </div>
  );
}
