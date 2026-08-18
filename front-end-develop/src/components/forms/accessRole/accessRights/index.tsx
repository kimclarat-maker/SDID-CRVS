import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Header, Modal, Text } from "rsuite";
import SelectDropdown from "@/components/select";
import { useFetchRole } from "@/hooks/useRole";
import { useFetchModules } from "@/hooks/useModules";
import ListItem from "@/components/List";
import Checkbox from "@/components/checkbox";
import capitalizeText from "@/utils/common/capitalizeText";

type Permissions = {
  delete: string;
  get: string;
  post: string;
  update: string;
};

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  handleClose: () => void;
};

const defaultPermission = {
  delete: "N",
  get: "N",
  post: "N",
  update: "N",
};

export default function AccessRightForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const { roles, loadingRoles, fetchRolesData } = useFetchRole("dropdown");
  const { modules, loadingModules, fetchModulesData } =
    useFetchModules("dropdown");
  const [permissions, setPermissions] =
    useState<Permissions>(defaultPermission);

  useEffect(() => {
    fetchRoles();
    fetchModules();
  }, []);

  useEffect(() => {
    setPermissions(values.modifyPermission || defaultPermission);
  }, [values.modifyPermission]);

  console.log(roles);

  const fetchRoles = (search?: string) => {
    fetchRolesData({
      offset: 0,
      search: search || undefined,
    });
  };

  const fetchModules = (search?: string) => {
    fetchModulesData({
      offset: 0,
      search: search || undefined,
    });
  };

  const handlePermissionChange = (key: keyof Permissions, value: string) => {
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [key]: value,
    }));
  };

  useEffect(() => {
    setFieldValue("permissions", [
      {
        module: values?.module?.value || values.module,
        ...permissions,
      },
    ]);
  }, [permissions, values.module, setFieldValue]);

  console.log({ roles });

  return (
    <>
      <div className="card-body rs-modal-body">
        <SelectDropdown
          options={roles}
          name="roleId"
          testId="roleId"
          label={translation.role}
          placeholder={translation.select}
          required
          value={values.roleId}
          onChange={(value) => setFieldValue("roleId", value)}
          error={errors.roleId}
          loading={loadingRoles}
        />

        <SelectDropdown
          options={modules}
          name="module"
          testId="module"
          label={translation.module}
          placeholder={translation.select}
          required
          value={values.module}
          onChange={(value) => setFieldValue("module", value)}
          error={errors.module}
          loading={loadingModules}
          onSearch={(e) => fetchModules(e)}
        />

        <Header>
          <Text className="textBold">{translation.permissions}</Text>
        </Header>
        {Object.keys(permissions).map((key) => (
          <ListItem key={key}>
            <Checkbox
              label={capitalizeText(key)}
              name={permissions[key as keyof Permissions]}
              checked={permissions[key as keyof Permissions] === "Y"}
              onChange={() =>
                handlePermissionChange(
                  key as keyof Permissions,
                  permissions[key as keyof Permissions] === "N" ? "Y" : "N"
                )
              }
              testId="permissionItem"
            />
          </ListItem>
        ))}
      </div>

      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={handleClose}
          appearance="default"
          testId="cancel"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
          testId="submit"
        />
      </Modal.Footer>
    </>
  );
}
