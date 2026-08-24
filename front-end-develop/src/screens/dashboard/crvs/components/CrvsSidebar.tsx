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
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_VIEW) && {
      name: "Birth notifications",
      icon: "campaign",
      route: "/dashboard/crvs/notifications",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_NOTIFICATION_CREATE) && {
      name: "New notification",
      icon: "add_circle",
      route: "/dashboard/crvs/notifications/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_VIEW) && {
      name: "Birth registrations",
      icon: "assignment",
      route: "/dashboard/crvs/births",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.BIRTH_DRAFT_CREATE) && {
      name: "New registration",
      icon: "add_circle",
      route: "/dashboard/crvs/births/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CORRECTION_RESPOND) && {
      name: "Corrections",
      icon: "edit_note",
      route: "/dashboard/crvs/births/corrections",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EVIDENCE_REVIEW) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTRATION_APPROVE)) && {
      name: "Review queue",
      icon: "fact_check",
      route: "/dashboard/crvs/review",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.REGISTERED_VIEW) && {
      name: "Registered births",
      icon: "verified",
      route: "/dashboard/crvs/registered-births",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.EXCEPTIONS_VIEW) && {
      name: "Exceptions",
      icon: "warning",
      route: "/dashboard/crvs/exceptions",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_DASHBOARD_VIEW) && {
      name: "Birth certificates",
      icon: "workspace_premium",
      route: "/dashboard/crvs/certificates",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REQUEST_ASSIST) && {
      name: "New assisted request",
      icon: "add_circle",
      route: "/dashboard/crvs/certificates/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_REVIEW_VIEW) && {
      name: "Certificate review",
      icon: "fact_check",
      route: "/dashboard/crvs/certificates/manual-review",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.CERTIFICATE_CONFIGURATION_MANAGE) && {
      name: "Certificate configuration",
      icon: "settings",
      route: "/dashboard/crvs/certificates/configuration",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.ANALYTICS_VIEW) && {
      name: "Reports",
      icon: "insights",
      route: "/dashboard/crvs/reports",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.AUDIT_VIEW) && {
      name: "Audit history",
      icon: "history",
      route: "/dashboard/crvs/audit",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW)) && {
      name: "Death registration",
      icon: "sentiment_very_dissatisfied",
      route: "/dashboard/crvs/deaths",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_VIEW) && {
      name: "Death notifications",
      icon: "campaign",
      route: "/dashboard/crvs/death-notifications",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_NOTIFICATION_CREATE) && {
      name: "New death notification",
      icon: "add_circle",
      route: "/dashboard/crvs/death-notifications/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW) && {
      name: "Death registrations",
      icon: "assignment",
      route: "/dashboard/crvs/death-registrations",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_DRAFT_CREATE) && {
      name: "New death registration",
      icon: "add_circle",
      route: "/dashboard/crvs/death-registrations/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_REVIEW) && {
      name: "Death review queue",
      icon: "fact_check",
      route: "/dashboard/crvs/death-review",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_REGISTRATION_VIEW) && {
      name: "Registered deaths",
      icon: "verified",
      route: "/dashboard/crvs/registered-deaths",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_EXCEPTIONS_VIEW) && {
      name: "Death exceptions",
      icon: "warning",
      route: "/dashboard/crvs/death-exceptions",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_SDID_SYNC_RETRY) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_SDID_SYNC_VIEW)) && {
      name: "Death sync failures",
      icon: "sync_problem",
      route: "/dashboard/crvs/death-sync-failures",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DEATH_AUDIT_VIEW) && {
      name: "Death audit history",
      icon: "history",
      route: "/dashboard/crvs/death-audit",
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
