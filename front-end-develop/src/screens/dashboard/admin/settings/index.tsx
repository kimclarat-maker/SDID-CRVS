import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useEffect, useState } from "react";
import Profile from "@/components/profile";
import SMS from "@/screens/dashboard/admin/configurations/sms";
import Roles from "@/screens/dashboard/admin/accessRoles/roles";
import CustomTabs from "@/components/tabs";
import { getStorage } from "@/utils/storage";
import { UserType } from "@/types/User";
import Holidays from "../holidays";
import EmailTemplate from "@/screens/dashboard/admin/configurations/emailTemplate";
import SMSTemplate from "../configurations/smsTemplate";
import { Nav, Stack } from "rsuite";
import useScreenSize from "@/hooks/useScreenSize";
import EmailConfiguration from "@/screens/dashboard/admin/configurations/email";
import Icon from "@/components/icon";
import Modules from "../modules";
import AccessRights from "../accessRoles/accessRights";
import { defineAccess } from "@/utils/common/permissions";
import StackItem from "rsuite/esm/Stack/StackItem";
import Card from "@/components/card";

type NavTypes = {
  active: string;
  onSelect: (e: any) => void;
  appearance: "default" | "subtle" | "tabs" | undefined;
};

function Settings() {
  const { translation } = useContext(LanguageContext);
  const [userInfo, setUserInfo] = useState<UserType | null>(null);
  const [activeEmail, setActiveEmail] = useState("email_template");
  const [activeSMS, setActiveSMS] = useState("sms_template");
  const [activeRole, setActiveRole] = useState("roles");
  const { isTablet, isPhone } = useScreenSize();
  const [tab, setTab] = useState("email");

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userLoggedIn = await getStorage();
      setUserInfo(userLoggedIn);
    };

    fetchUserInfo();
  }, []);

  const EmailNav: React.FC<NavTypes> = ({ active, onSelect, ...props }) => {
    return (
      <div>
        <Nav
          {...props}
          vertical={!isTablet || !isPhone}
          activeKey={active}
          onSelect={onSelect}
        >
          <Nav.Item
            eventKey="email_template"
            style={{ marginBottom: "0.5rem" }}
          >
            <div className="d-flex gap-2">
              <Icon name="email" />
              <span className="textBold">{translation.email_template}</span>
            </div>
          </Nav.Item>
          <Nav.Item eventKey="email_configuration">
            <div className="d-flex gap-2">
              <Icon name="settings" />
              <span className="textBold">
                {translation.email_configuration}
              </span>
            </div>
          </Nav.Item>
        </Nav>
      </div>
    );
  };

  const SMSNav: React.FC<NavTypes> = ({ active, onSelect, ...props }) => {
    return (
      <Nav
        {...props}
        vertical={!isTablet || !isPhone}
        activeKey={active}
        onSelect={onSelect}
      >
        <Nav.Item eventKey="sms_template" style={{ marginBottom: "0.5rem" }}>
          <div className="d-flex gap-2">
            <Icon name="sms" />
            <span className="textBold">{translation.sms_template}</span>
          </div>
        </Nav.Item>
        <Nav.Item eventKey="sms_configuration">
          <div className="d-flex gap-2">
            <Icon name="settings" />
            <span className="textBold">{translation.sms_configuration}</span>
          </div>
        </Nav.Item>
      </Nav>
    );
  };

  const RolesNav: React.FC<NavTypes> = ({ active, onSelect, ...props }) => {
    return (
      <Nav
        {...props}
        vertical={!isTablet || !isPhone}
        activeKey={active}
        onSelect={onSelect}
      >
        <Nav.Item eventKey="roles">
          <div className="d-flex gap-2">
            <Icon name="settings_account_box" />
            <span className="textBold">{translation.access_roles}</span>
          </div>
        </Nav.Item>
        <Nav.Item eventKey="accessRights">
          <div className="d-flex gap-2">
            <Icon name="table_eye" />
            <span className="textBold">{translation.permissions}</span>
          </div>
        </Nav.Item>
        <Nav.Item eventKey="modules">
          <div className="d-flex gap-2">
            <Icon name="apps" />
            <span className="textBold">{translation.modules}</span>
          </div>
        </Nav.Item>
      </Nav>
    );
  };

  return (
    <div>
      <CustomTabs
        activeTab={tab}
        getTab={(t: string) => setTab(t)}
        options={[
          {
            title: translation.my_profile,
            key: "profile",
            data:
              tab === "profile" ? (
                <Card>
                  <div className="col-md-6">
                    <Profile {...(userInfo?.account || {})} />
                  </div>{" "}
                </Card>
              ) : (
                <></>
              ),
          },
          defineAccess({ method: "get", module: "accessrights" }) && {
            title: translation.access_roles,
            key: "roles",
            data:
              tab === "roles" ? (
                <Stack
                  wrap={isPhone || isTablet}
                  alignItems="flex-start"
                  spacing={32}
                >
                  <StackItem>
                    <RolesNav
                      active={activeRole}
                      onSelect={setActiveRole}
                      appearance="subtle"
                    />
                  </StackItem>
                  <StackItem grow={1}>
                    {activeRole === "roles" && <Roles />}
                    {activeRole === "accessRights" && <AccessRights />}
                    {activeRole === "modules" && <Modules />}
                  </StackItem>
                </Stack>
              ) : (
                <></>
              ),
          },
          (defineAccess({ method: "get", module: "emailSettings" }) ||
            defineAccess({ method: "get", module: "emailTemplates" })) && {
            title: translation.email_settings,
            key: "email",
            data:
              tab === "email" ? (
                <Stack
                  wrap={isPhone || isTablet}
                  alignItems="flex-start"
                  spacing={32}
                >
                  <StackItem>
                    <EmailNav
                      active={activeEmail}
                      onSelect={setActiveEmail}
                      appearance="subtle"
                    />
                  </StackItem>
                  <StackItem grow={1}>
                    {activeEmail === "email_template" &&
                      defineAccess({
                        method: "get",
                        module: "emailTemplates",
                      }) && <EmailTemplate />}
                    {activeEmail === "email_configuration" &&
                      defineAccess({
                        method: "get",
                        module: "emailSettings",
                      }) && <EmailConfiguration />}
                  </StackItem>
                </Stack>
              ) : (
                <></>
              ),
          },
          (defineAccess({ method: "get", module: "smsSettings" }) ||
            defineAccess({ method: "get", module: "smsTemplates" })) && {
            title: translation.sms_settings,
            key: "sms",
            data:
              tab === "sms" ? (
                <Stack
                  wrap={isPhone || isTablet}
                  alignItems="flex-start"
                  spacing={32}
                >
                  <StackItem>
                    <SMSNav
                      active={activeSMS}
                      onSelect={setActiveSMS}
                      appearance="subtle"
                    />
                  </StackItem>
                  <StackItem grow={1}>
                    {activeSMS === "sms_template" &&
                      defineAccess({
                        method: "get",
                        module: "smsTemplates",
                      }) && <SMSTemplate />}
                    {activeSMS === "sms_configuration" &&
                      defineAccess({
                        method: "get",
                        module: "smsSettings",
                      }) && <SMS />}
                  </StackItem>
                </Stack>
              ) : (
                <></>
              ),
          },
          defineAccess({ method: "post", module: "holidays" }) && {
            title: translation.holidays,
            key: "holidays",
            data: tab === "holidays" ? <Holidays /> : <></>,
          },
        ].filter(Boolean)}
      />
    </div>
  );
}

export default Settings;
