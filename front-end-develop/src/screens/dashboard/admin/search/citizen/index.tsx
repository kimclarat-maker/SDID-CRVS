import {
  fetchPrenrollmentByDemographics,
  fetchPrenrollmentByIdentifier,
  fetchPrenrollmentByPrenrollmentNumber,
} from "@/api/prenrollment";
import Alert from "@/components/alert";
import SearchForm from "@/components/forms/search";
import Header from "@/components/header";
import { LanguageContext } from "@/context/LanguageContext";
import { extractErrorMessage } from "@/utils/common/error/handler";
import { searchValidationSchema } from "@/validation/search.citizen.validation";
import { useFormik } from "formik";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Profile from "../../prenrollement/profile";
import { Prenrollment } from "@/types/Prenrollment";
import Loading from "@/components/loader";
import { useLocation } from "react-router-dom";
import List from "./list";
import Modal from "@/components/Modal";
import { fetchEnrollments } from "@/api/enrollments";
import { searchOptions } from "@/constants/search";
import { getStorage } from "@/utils/storage";

interface Props {
  title?: string;
  description?: string;
  type?: string;
  showTitle?: boolean;
  from?: string;
}

interface FormProps {
  type: any;
  search?: string;
  dob?: string;
  fatherNames?: string;
  motherNames?: string;
  firstName?: string;
  lastName?: string;
  refresh?: boolean;
}

interface MessageType {
  type: "error" | "info" | "success" | "warning";
  message: string;
}

const SearchCitizen: React.FC<Props> = ({
  title,
  description,
  type,
  showTitle,
  from,
}) => {
  const { translation } = useContext(LanguageContext);
  const [message, setMessage] = useState<MessageType | null>();
  const [data, setData] = useState<Prenrollment | null>({} as Prenrollment);
  const [multipleRecords, setMultipleRecords] = useState<Prenrollment[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [showMultipleResults, setShowMultipleResults] = useState(false);

  const searchParams = new URLSearchParams(location.search);

  const prq = searchParams.get("prq");

  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const getInfo = async () => {
      const loginType = await getStorage("loginType", "local");

      console.log("loginType", loginType);

      if (
        loginType === "local" ||
        loginType === "'local'" ||
        loginType === '"local"'
      ) {
        setRefresh(true);
      }
    };

    getInfo();
  }, []);

  const validationSchema = useMemo(
    () => searchValidationSchema(translation),
    [translation]
  );

  const formik = useFormik<FormProps>({
    initialValues: {
      type: searchOptions(translation.default, type)[type === "entry" ? 1 : 0],
      search: prq || "",
      dob: "",
      fatherNames: "",
      motherNames: "",
      firstName: "",
      lastName: "",
      refresh: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        let data: any;
        setData(null);
        setMessage(null);
        setLoading(true);

        if (values?.type?.value === "custom" && values.firstName) {
          data = await fetchPrenrollmentByDemographics({
            dateOfBirth: values.dob,
            fatherName: values.fatherNames || "",
            motherName: values.motherNames || "",
            firstName: values.firstName,
            lastName: values.lastName,
            refresh: values.refresh,
          });
        }

        if (values?.type?.value === "prenrollmentNo") {
          data = await fetchPrenrollmentByPrenrollmentNumber(
            values.search?.toUpperCase() || "",
            refresh
          );
        }

        if (values?.type?.value === "enrollmentNo") {
          data = await fetchEnrollments({
            enrollmentNumber: values.search?.toUpperCase() || "",
            refresh,
          });

          data = data?.data?.length > 0 ? { data: data.data[0] } : null;
        }

        if (
          values?.type?.value === "applicationNumber" ||
          values?.type?.value === "idNumber"
        ) {
          data = await fetchPrenrollmentByIdentifier(
            values.search || "",
            refresh
          );
        }

        if (data && data.data._id) {
          setData(data.data);
          setLoading(false);
          setEnrollmentStatus(data.data.enrollmentStatus);

          return;
        }

        if (
          data?.data?.data &&
          Array.isArray(data?.data?.data) &&
          data?.data?.data?.length > 0
        ) {
          setMultipleRecords(data.data.data);
          setLoading(false);
          setShowMultipleResults(true);
          return;
        }

        setMessage({
          type: "error",
          message: translation.no_data_found,
        });

        setLoading(false);
      } catch (error) {
        setMessage({
          type: "error",
          message: extractErrorMessage(error),
        });
        setLoading(false);
      }
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (prq && prq?.toUpperCase()?.includes("PR") && prq?.length >= 10) {
      formik.setFieldValue("search", prq);
      formik.submitForm();
    }
  }, [prq]);

  const renderSearch = () => {
    return (
      <div>
        {(title || showTitle) && (
          <>
            <Header
              title={
                showTitle ? translation.retrieve_citizen_information : title
              }
              description={
                showTitle
                  ? translation.search_by_application_number
                  : description
              }
            />
            <br />
          </>
        )}

        {message && (
          <>
            <Alert type={message.type}>{message.message}</Alert>
            <br />
          </>
        )}
        <SearchForm
          type={type}
          {...formik}
          setData={setData}
          handleReset={(e: any) => {
            setData(null);
            formik.handleReset(e);
          }}
          refresh={refresh}
          setRefresh={setRefresh}
        />
      </div>
    );
  };

  const renderResults = () => {
    if (data) {
      return (
        <Profile
          data={data}
          enrollmentStatus={enrollmentStatus}
          fetchData={formik.handleSubmit}
          from={from}
          type={formik.values?.type?.value}
        />
      );
    } else {
      return <></>;
    }
  };

  const renderList = () => {
    return (
      <List
        data={multipleRecords}
        setData={(data) => {
          setShowMultipleResults(false);
          setData(data);
          formik.setFieldValue("type", {
            label: translation.prenrollment_number,
            value: "prenrollmentNo",
          });
          formik.setFieldError("search", "");
        }}
      />
    );
  };

  return (
    <>
      {renderSearch()}
      {loading ? (
        <Loading isFullScreen />
      ) : (
        <>
          <br />
          {renderResults()}
        </>
      )}

      <Modal
        show={showMultipleResults}
        handleClose={() => setShowMultipleResults(false)}
        size="lg"
      >
        <div className="rs-modal-body" style={{ minHeight: "10vh" }}>
          {renderList()}
        </div>
      </Modal>
    </>
  );
};

export default SearchCitizen;
