import { LanguageContext } from "@/context/LanguageContext";
import { ChangeEvent, useContext, useEffect } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { RoleType } from "@/types/ROLE";
import { useFetchRole } from "@/hooks/useRole";
import CheckboxGroup from "@/components/checkbox/group";
import Checkbox from "@/components/checkbox";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  handleChange: (e: ChangeEvent<any>) => void;
  setFieldValue: any;
  handleClose?: () => void;
};

export default function AddMenuForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const { roles, loadingRoles, fetchRolesData } = useFetchRole();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = (search?: string) => {
    fetchRolesData({
      offset: 0,
      limit: 10,
      search: search ? search : undefined,
    });
  };
  return (
    <>
      <div className="card-body  rs-modal-body">
        <Input
          name="name"
          label={translation.name}
          placeholder={translation.name_placeholder}
          required
          value={values.name}
          onChange={(value) => setFieldValue("name", value)}
          error={errors.name}
        />
        <CheckboxGroup
          name={translation.access_roles}
          error={errors.accessRoles}
          onChange={(role) => setFieldValue("accessRoles", role)}
          value={values.accessRoles}
          loading={loadingRoles}
          testId="accessRoles"
        >
          {roles.map((el: RoleType, i) => {
            return (
              <Checkbox
                key={i}
                name={el.name}
                label={el.name}
                description={el.value}
                value={el._id || ""}
              />
            );
          })}
        </CheckboxGroup>
      </div>

      <RadioGroup
        name={translation.status}
        error={errors.status}
        onChange={(status) => setFieldValue("status", status)}
        value={values.status}
        inline
      >
        {[
          {
            label: translation.active,
            value: "active",
          },
          {
            label: translation.inactive,
            value: "inactive",
          },
        ].map((el: any, i) => {
          return (
            <Radio name={el.label} label={el.label} value={el.value} key={i} />
          );
        })}
      </RadioGroup>

      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          appearance="default"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </>
  );
}
