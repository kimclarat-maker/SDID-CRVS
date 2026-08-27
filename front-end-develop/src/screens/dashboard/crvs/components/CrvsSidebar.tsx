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
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW) && {
      name: "Marriage registration",
      icon: "favorite",
      route: "/dashboard/crvs/marriages",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_VIEW) && {
      name: "Marriage applications",
      icon: "assignment",
      route: "/dashboard/crvs/marriage-applications",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_CREATE) && {
      name: "New marriage declaration",
      icon: "add_circle",
      route: "/dashboard/crvs/marriage-applications/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPLICATION_REVIEW) && {
      name: "Marriage review queue",
      icon: "fact_check",
      route: "/dashboard/crvs/marriage-review",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CORRECTION_REQUEST) && {
      name: "Marriage corrections",
      icon: "edit_note",
      route: "/dashboard/crvs/marriage-corrections",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW) && {
      name: "Marriage appointments",
      icon: "event",
      route: "/dashboard/crvs/marriage-appointments",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_APPOINTMENT_VIEW) && {
      name: "Appointment calendar",
      icon: "calendar_month",
      route: "/dashboard/crvs/marriage-appointments/calendar",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_CEREMONY_VIEW) && {
      name: "Today's ceremonies",
      icon: "celebration",
      route: "/dashboard/crvs/marriage-ceremonies",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_OBJECTIONS_VIEW) && {
      name: "Marriage objections",
      icon: "flag",
      route: "/dashboard/crvs/marriage-objections",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_EXCEPTIONS_VIEW) && {
      name: "Marriage exceptions",
      icon: "warning",
      route: "/dashboard/crvs/marriage-exceptions",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_REGISTERED_VIEW) && {
      name: "Registered marriages",
      icon: "verified",
      route: "/dashboard/crvs/registered-marriages",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_RETRY) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_SDID_SYNC_VIEW)) && {
      name: "Marriage sync failures",
      icon: "sync_problem",
      route: "/dashboard/crvs/marriage-sync-failures",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.MARRIAGE_AUDIT_VIEW) && {
      name: "Marriage audit history",
      icon: "history",
      route: "/dashboard/crvs/marriage-audit",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW) && {
      name: "Divorce registration",
      icon: "heart_broken",
      route: "/dashboard/crvs/divorces",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_NOTIFICATION_VIEW) && {
      name: "Divorce notifications",
      icon: "gavel",
      route: "/dashboard/crvs/divorce-notifications",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_VIEW) && {
      name: "Divorce registrations",
      icon: "assignment",
      route: "/dashboard/crvs/divorce-registrations",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_CREATE) && {
      name: "New divorce registration",
      icon: "add_circle",
      route: "/dashboard/crvs/divorce-registrations/new",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTRATION_REVIEW) && {
      name: "Divorce review queue",
      icon: "fact_check",
      route: "/dashboard/crvs/divorce-review",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_CORRECTION_REQUEST) && {
      name: "Divorce corrections",
      icon: "edit_note",
      route: "/dashboard/crvs/divorce-corrections",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_FOREIGN_JUDGMENT_REVIEW) && {
      name: "Foreign divorces",
      icon: "public",
      route: "/dashboard/crvs/foreign-divorces",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_EXCEPTIONS_VIEW) && {
      name: "Divorce exceptions",
      icon: "warning",
      route: "/dashboard/crvs/divorce-exceptions",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_REGISTERED_VIEW) && {
      name: "Registered divorces",
      icon: "verified",
      route: "/dashboard/crvs/registered-divorces",
    },
    (hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_RETRY) ||
      hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_SDID_SYNC_VIEW)) && {
      name: "Divorce sync failures",
      icon: "sync_problem",
      route: "/dashboard/crvs/divorce-sync-failures",
    },
    hasWorkspacePermission("CRVS", CRVS_PERMISSIONS.DIVORCE_AUDIT_VIEW) && {
      name: "Divorce audit history",
      icon: "history",
      route: "/dashboard/crvs/divorce-audit",
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
