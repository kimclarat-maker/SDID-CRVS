import Button from "@/components/button";
import Icon from "@/components/icon";
import Input from "@/components/input";
import SelectDropdown from "@/components/select";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext, useState } from "react";
import { ButtonToolbar, IconButton } from "rsuite";
import QRSearch from "./qr";
import moment from "moment";
import Modal from "@/components/Modal";
import { Prenrollment } from "@/types/Prenrollment";
import { isNumberInput } from "@/utils/common/validateInput";
import { searchOptions } from "@/constants/search";
import Checkbox from "@/components/checkbox";

interface Props {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  setFieldValue: any;
  setData: (data: Prenrollment) => void;
  handleReset: (e: any) => void;
  type?: string;
  refresh?: boolean;
  setRefresh?: (b: boolean) => void;
}

const SearchForm: React.FC<Props> = ({
  values,
  setFieldValue,
  errors,
  isSubmitting,
  handleSubmit,
  setData,
  handleReset,
  type,
  refresh,
  setRefresh,
}) => {
  const { translation } = useContext(LanguageContext);
  const [openQRSearchModal, setOpenQRSearchModal] = useState(false);

  const renderCustomSearch = () => {
    return (
      <>
        <div className="col-md-12">
          <div className="row gap-sm-3">
            <div className="col-md-4">
              <Input
                name="firstName"
                leftIcon="person"
                value={values.firstName}
                error={errors.firstName}
                onChange={(e) => setFieldValue("firstName", e)}
                label={translation.surname}
                placeholder={translation.surname_placeholder}
                onKeyDown={(event: any) => {
                  if (isNumberInput(event)) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
            <div className="col-md-4">
              <Input
                name="lastName"
                leftIcon="person"
                value={values.lastName}
                error={errors.lastName}
                onChange={(e) => setFieldValue("lastName", e)}
                label={translation.post_name}
                placeholder={translation.post_name_placeholder}
                onKeyDown={(event: any) => {
                  if (isNumberInput(event)) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <Input
            name="dob"
            leftIcon="calendar_month"
            value={values.dob}
            error={errors.dob}
            onChange={(e) => setFieldValue("dob", e)}
            type="date"
            label={translation.dob}
            max={moment().format("YYYY-MM-DD")}
          />
        </div>
        <div className="col-md-12">
          <div className="row">
            <div className="col-md-4">
              <Input
                name="fatherNames"
                leftIcon="person"
                value={values.fatherNames}
                error={errors.fatherNames}
                onChange={(e) => setFieldValue("fatherNames", e)}
                label={translation.father_name}
                placeholder={translation.father_names_placeholder}
                onKeyDown={(event: any) => {
                  if (isNumberInput(event)) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
            <div className="col-md-4">
              <Input
                name="motherNames"
                leftIcon="person"
                value={values.motherNames}
                error={errors.motherNames}
                onChange={(e) => setFieldValue("motherNames", e)}
                label={translation.mother_name}
                placeholder={translation.mother_names_placeholder}
                onKeyDown={(event: any) => {
                  if (isNumberInput(event)) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderQR = () => {
    return (
      <QRSearch
        getResult={(search: string, data: Prenrollment) => {
          setFieldValue(search);
          setData(data);
        }}
        handleClose={() => setOpenQRSearchModal(false)}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="row">
          <div
            className={
              values?.type?.value === "custom" ? "col-md-4" : "col-md-5"
            }
          >
            <SelectDropdown
              testId="selection"
              name="type"
              options={searchOptions(translation.default, type)}
              leftIcon="person"
              value={values.type}
              error={errors.type}
              onChange={(e) => setFieldValue("type", e)}
              containerStyles={{
                marginBottom: values?.type?.value === "custom" ? "1rem" : 0,
              }}
            />
          </div>
          <div
            className={
              values?.type?.value === "custom" ? "col-md-4" : "col-md-5"
            }
          >
            <Input
              testId="search-input"
              name="search"
              value={values.search}
              error={errors.search}
              leftIcon="search"
              onChange={(e) => setFieldValue("search", e)}
              rightContent={
                <IconButton
                  onClick={() => setOpenQRSearchModal(true)}
                  icon={<Icon name="qr_code_scanner" />}
                />
              }
              placeholder={
                translation[
                  `enter_${
                    values?.type?.value === "prenrollmentNo"
                      ? "prenrollment_number"
                      : "id_number"
                  }`
                ]
              }
              containerStyles={{
                marginBottom: values?.type?.value === "custom" ? "1rem" : 0,
              }}
              maxLength={
                values?.type?.value === "prenrollmentNo" ||
                values?.type?.value === "enrollmentNo"
                  ? 10
                  : values?.type?.value === "applicationNumber"
                  ? 8
                  : values?.type?.value === "idNumber"
                  ? 16
                  : 13
              }
              type={
                values?.type?.value === "idNumber" ||
                values?.type?.value === "applicationNumber"
                  ? "number"
                  : "text"
              }
            />
          </div>
          {values?.type?.value === "custom" && renderCustomSearch()}
          <div className="col-md-2" style={{ marginTop: "0.3rem" }}>
            <ButtonToolbar>
              {values?.type?.value === "custom" && (
                <Button
                  text={translation.reset}
                  onClick={handleReset}
                  testId="reset"
                  appearance="ghost"
                />
              )}
              <Button
                text={translation.search}
                loading={isSubmitting}
                onClick={handleSubmit}
                testId="search"
              />
            </ButtonToolbar>
          </div>
        </div>
        <Checkbox
          name="refresh"
          label={translation.refresh}
          checked={refresh}
          onChange={() => setRefresh?.(!refresh)}
        />
      </div>

      <Modal
        show={openQRSearchModal}
        handleClose={() => setOpenQRSearchModal(false)}
        size="xs"
        title={"Search Citizen Information"}
      >
        {renderQR()}
      </Modal>
    </div>
  );
};

export default SearchForm;
