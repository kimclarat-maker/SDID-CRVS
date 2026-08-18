import { InfoCardType } from "@/types/InfoCard";
import "./styles.css";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import userPhotoPlaceholder from "@/assets/userPhotoPlaceholder.png";
import Header from "./header";
import { List, Panel, Stack, Tag, TagGroup, Text } from "rsuite";
import useScreenSize from "@/hooks/useScreenSize";
import { FieldItem } from "./filedItem";
import capitalizeText from "@/utils/common/capitalizeText";
import StackItem from "rsuite/esm/Stack/StackItem";
import userImage from "@/assets/userPhotoPlaceholder.png";
import normalizeDate from "@/utils/common/date/normalizeDate";
import {
  convertCountryCodeToName,
  formateNationality,
} from "@/utils/common/countryNameFormat";
import Card from "../card";
import Alert from "../alert";
import moment from "moment";
import ReactMarkdown from "react-markdown";
import Documents from "../documents";

function InfoCard({
  isDefault,
  active,
  institution,
  firstName,
  lastName,
  dob,
  gender,
  idNumber,
  photo,
  hideFields = [],
  photoPlacement,
  selectedInformation,
  handleCheckbox,
  province,
  cell,
  district,
  sector,
  village,
  handleCheckAll,
  isCheckedAll,
  handleNext,
  showRightContent,
  selfie,
  countryOfDomicile,
  otherNationality,
  nationality,
  placeOfBirth,
  countryOfBirth,
  motherNames,
  fatherNames,
  preHistoricalInfo,
  photoComparison,
  typeOfRwandanNationality,
  spouse,
  redFlags,
  maritalStatus,
  historicalData,
  fatherIDNumber,
  motherIDNumber,
  spouseIDNumber,
  residentialAddress,
  residentialCountry,
  residentialProvince,
  residentialDistrict,
  residentialSector,
  residentialCell,
  residentialVillage,
  preEnrollmentNumber,
  preEnrollmentDate,
  size,
  legalGuardianIdentifier,
  applicantCategory,
  documentType,
  ipAddress,
  status,
  citizenship,
  isFromLogs,
  requestForChangeComment,
  requestForChangeFields,
  guardianStatus,
  legalGuardianName,
  consentContent,
  phoneNumber,
  email,
  showContacts,
  digitalAmbassador,
  page,
  supportingDocuments,
  showApplicantCatergory,
  showSupportingDocuments,
  fatherInfo,
  motherInfo,
  spouseInfo,
  originalSpouseName,
  originalFatherNames,
  originalFatherIDNumber,
  lgType,
  originalMotherIDNumber,
  originalSpouseIDNumber,
  originalMotherNames,
  address,
  rollbackReason,
}: InfoCardType) {
  const { translation } = useContext(LanguageContext);
  const [show, setShow] = useState(true);
  const [modifiedHideFields, setHideFields] = useState(hideFields);
  const { isPhone, isTablet } = useScreenSize();

  const guardianRelationship =
    guardianStatus === "birth"
      ? translation.biological_parent
      : guardianStatus === "guardian"
      ? translation.legal_guardian
      : guardianStatus === "adoption"
      ? translation.adoptive_parent
      : "";
  const handleShowInfo = (type?: string) => {
    if (type) {
      if (modifiedHideFields.includes(type)) {
        modifiedHideFields.splice(modifiedHideFields.indexOf(type), 1);
      } else {
        modifiedHideFields.push(type);
      }

      return setHideFields([...modifiedHideFields]);
    }
    setShow(!show);
  };

  const renderPhotoReview = () => {
    if (preHistoricalInfo?.nida?.photo) {
      const photo = preHistoricalInfo?.nida?.photo;
      return (
        <Stack wrap spacing={8}>
          <StackItem style={{ marginBottom: "1rem" }}>
            <Panel bordered header="Selfie">
              <div className="citizen-profile">
                <img src={selfie || userImage} />
              </div>
            </Panel>
          </StackItem>
          {photo && (
            <StackItem style={{ marginBottom: "1rem", width: "100%" }}>
              <Panel bordered header="NIDA">
                <div className="userPhoto">
                  <img src={photo} />
                </div>
              </Panel>
            </StackItem>
          )}
        </Stack>
      );
    }
  };

  return (
    <div>
      {preEnrollmentNumber ? (
        <>
          <Alert type="success">
            <h3>{preEnrollmentNumber}</h3>
            <Stack spacing={16}>
              <Stack.Item>
                <Tag color={status === "APPROVED" ? "green" : "orange"}>
                  {status}
                </Tag>
              </Stack.Item>
              <Stack.Item>
                <Text>{moment(preEnrollmentDate).format("lll")}</Text>
              </Stack.Item>
            </Stack>
          </Alert>
          <br />
        </>
      ) : (
        requestForChangeComment &&
        page !== "RFA" && (
          <>
            <Alert type="warning">
              <p>{requestForChangeComment}</p>{" "}
              <TagGroup>
                {requestForChangeFields?.map((el: string, i: number) => {
                  return <Tag key={i}>{translation[el]}</Tag>;
                })}
              </TagGroup>
            </Alert>
            <br />
          </>
        )
      )}

      {status === "ROLLBACK" && (
        <>
          <Alert type="info">{rollbackReason}</Alert>
          <br />
        </>
      )}

      {show && (
        <div
          style={{
            paddingLeft: institution ? 32 : 0,
            paddingTop: institution ? "1rem" : 0,
          }}
        >
          {photoPlacement === "top" && photoComparison
            ? renderPhotoReview()
            : photoPlacement === "top" && (
                <>
                  <div className="citizen-profile">
                    <img
                      src={
                        preHistoricalInfo?.nida?.photo ||
                        selfie ||
                        userPhotoPlaceholder
                      }
                    />
                  </div>
                  <br />
                </>
              )}

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div className="row mb-4">
                <div
                  className={`col-md-${size}`}
                  // style={
                  //   photoPlacement === "right"
                  //     ? { height: "100vh", overflowY: "auto" }
                  //     : {}
                  // }
                >
                  <div>
                    {showRightContent && (
                      <div>
                        <Header
                          show={show}
                          title={
                            (!isPhone || !isTablet) && institution
                              ? translation.information_from
                              : translation.applicant_information
                          }
                          institution={
                            institution && capitalizeText(institution)
                          }
                          handleShowInfo={() =>
                            handleShowInfo
                              ? handleShowInfo()
                              : console.log(`handleShowInfo(id) not responding`)
                          }
                          handleCheckAll={handleCheckAll}
                          isCheckedAll={isCheckedAll}
                          handleNext={handleNext}
                          showRightContent={showRightContent}
                        />
                      </div>
                    )}
                  </div>
                  <Card
                    header={
                      <Text className="textBold textPrimary ">
                        {translation.identification_numbers}
                      </Text>
                    }
                    borderred
                  >
                    <List>
                      {applicantCategory && showApplicantCatergory && (
                        <FieldItem
                          title={`${translation.category}:`}
                          value={applicantCategory}
                          fieldName="applicantCategory"
                          disabled
                        />
                      )}
                      {preHistoricalInfo?.nida?.applicantNumber && (
                        <FieldItem
                          title={`${translation.application_number}:`}
                          value={preHistoricalInfo?.nida?.applicantNumber}
                          fieldName="applicationNumber"
                          disabled
                          prevInfo={
                            historicalData &&
                            historicalData["applicationNumber"] !==
                              preHistoricalInfo?.nida?.applicantNumber
                              ? historicalData["applicationNumber"]
                              : ""
                          }
                        />
                      )}
                      {idNumber && idNumber !== "" && (
                        <FieldItem
                          title={`${translation.id_number}:`}
                          value={idNumber}
                          fieldName="idNumber"
                          handleCheckbox={handleCheckbox}
                          selectedInformation={selectedInformation}
                          disabled
                          prevInfo={
                            historicalData &&
                            historicalData["idNumber"] !== idNumber
                              ? historicalData["idNumber"]
                              : ""
                          }
                        />
                      )}
                    </List>
                  </Card>
                  <br />
                  {isFromLogs && status?.toUpperCase() === "PENDING" && (
                    <>
                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                      >
                        <List>
                          <FieldItem
                            title={`${translation.applicant_category}:`}
                            value={applicantCategory}
                            fieldName="applicantCategory"
                            disabled
                          />
                          <FieldItem
                            title={`${translation.document_type}:`}
                            value={documentType}
                            fieldName="documentType"
                            disabled
                          />
                          <FieldItem
                            title={`${translation.citizenship}:`}
                            value={citizenship}
                            fieldName="citizenship"
                            disabled
                          />
                          <FieldItem
                            title="IP Address"
                            value={ipAddress}
                            fieldName="documentType"
                            disabled
                          />
                        </List>
                      </Card>
                      <br />
                    </>
                  )}
                  <Card
                    styles={{
                      border: "1px solid var(--rs-gray-100)",
                    }}
                    header={
                      <Text className="textBold textPrimary">
                        {translation.basic_information}
                      </Text>
                    }
                  >
                    <List>
                      <FieldItem
                        title={`${translation.surname}:`}
                        value={firstName}
                        fieldName="firstName"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["firstName"]?.toUpperCase() !==
                            firstName?.toUpperCase()
                            ? historicalData["firstName"]
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />
                      <FieldItem
                        title={`${translation.post_name}:`}
                        value={lastName}
                        fieldName="lastName"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["lastName"]?.toUpperCase() !==
                            lastName?.toUpperCase()
                            ? historicalData["lastName"]
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />
                      <FieldItem
                        title={`${translation.gender}:`}
                        value={translation[gender?.toLowerCase()] || gender}
                        fieldName="gender"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["gender"]?.toUpperCase() !==
                            gender?.toUpperCase() &&
                          translation[
                            historicalData["gender"]?.toLowerCase() ||
                              historicalData["gender"]
                          ]
                        }
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.dob}:`}
                        value={normalizeDate(dob)}
                        fieldName="dob"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData && historicalData["dob"]
                            ? normalizeDate(historicalData["dob"]) !==
                              normalizeDate(dob)
                              ? normalizeDate(historicalData["dob"])
                              : ""
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.martial_status}:`}
                        value={
                          translation[maritalStatus?.toLowerCase()] ||
                          maritalStatus
                        }
                        fieldName="maritalStatus"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        prevInfo={
                          historicalData &&
                          (
                            historicalData["maritalStatus"] &&
                            translation[
                              historicalData["maritalStatus"]?.toLowerCase()
                            ]
                          )?.toUpperCase() !==
                            (
                              translation[maritalStatus?.toLowerCase()] ||
                              maritalStatus
                            )?.toUpperCase()
                            ? translation[historicalData["maritalStatus"]]
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />
                      <FieldItem
                        title={`${translation.country_of_birth}:`}
                        value={convertCountryCodeToName(countryOfBirth)}
                        fieldName="countryOfBirth"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["countryOfBirth"] &&
                          convertCountryCodeToName(
                            countryOfBirth
                          )?.toUpperCase() !==
                            convertCountryCodeToName(
                              historicalData["countryOfBirth"]
                            )?.toUpperCase()
                            ? convertCountryCodeToName(
                                historicalData["countryOfBirth"]
                              )
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.placeOfBirth}:`}
                        value={
                          convertCountryCodeToName(placeOfBirth) ||
                          convertCountryCodeToName(placeOfBirth) !== ""
                            ? convertCountryCodeToName(placeOfBirth)
                            : placeOfBirth
                        }
                        fieldName="placeOfBirth"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData?.["placeOfBirth"] &&
                          convertCountryCodeToName(
                            placeOfBirth
                          )?.toUpperCase() !==
                            convertCountryCodeToName(
                              historicalData["placeOfBirth"]
                            )?.toUpperCase()
                            ? convertCountryCodeToName(
                                historicalData["placeOfBirth"]
                              )
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.nationality}:`}
                        value={formateNationality(nationality)}
                        fieldName="nationality"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["nationality"] &&
                          convertCountryCodeToName(
                            nationality
                          )?.toUpperCase() !==
                            convertCountryCodeToName(
                              historicalData["nationality"]
                            )?.toUpperCase()
                            ? convertCountryCodeToName(
                                historicalData["nationality"]
                              )
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.otherNationality}:`}
                        value={
                          otherNationality
                            ? convertCountryCodeToName(otherNationality)
                            : otherNationality
                        }
                        fieldName="otherNationality"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["otherNationality"] &&
                          otherNationality &&
                          convertCountryCodeToName(
                            otherNationality
                          )?.toUpperCase() !==
                            convertCountryCodeToName(
                              historicalData["otherNationality"]
                            )?.toUpperCase()
                            ? convertCountryCodeToName(
                                historicalData["otherNationality"]
                              )
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />

                      {residentialAddress && (
                        <FieldItem
                          title={`${translation.residential_address}:`}
                          value={residentialAddress}
                          fieldName="residentialAddress"
                          selectedInformation={selectedInformation}
                          disabled
                          isDefault={isDefault}
                        />
                      )}

                      <FieldItem
                        title={`${translation.typeOfRwandanNationality}:`}
                        value={
                          typeOfRwandanNationality?.label ||
                          typeOfRwandanNationality
                        }
                        fieldName="typeOfRwandanNationality"
                        isDefault={isDefault}
                        selectedInformation={selectedInformation}
                        disabled
                      />
                    </List>
                  </Card>
                  <br />
                  <Card
                    styles={{
                      border: "1px solid var(--rs-gray-100)",
                    }}
                    header={
                      <Text className="textBold textPrimary">
                        {translation.placeOfDomicile}
                      </Text>
                    }
                  >
                    <List>
                      <FieldItem
                        title={`${translation.country}:`}
                        value={convertCountryCodeToName(countryOfDomicile)}
                        fieldName="countryOfDomicile"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["countryOfDomicile"] &&
                          convertCountryCodeToName(
                            countryOfDomicile
                          )?.toUpperCase() !==
                            convertCountryCodeToName(
                              historicalData["countryOfDomicile"]
                            )?.toUpperCase()
                            ? convertCountryCodeToName(
                                historicalData["countryOfDomicile"]
                              )
                            : ""
                        }
                        disabled
                      />
                      <FieldItem
                        title={`${translation.province}:`}
                        value={province}
                        fieldName="province"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["province"]?.toUpperCase() !==
                            province?.toUpperCase()
                            ? historicalData["province"]
                            : ""
                        }
                        disabled
                      />
                      <FieldItem
                        title={`${translation.district}:`}
                        value={district}
                        fieldName="district"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["district"] !== district
                            ? historicalData["district"]
                            : ""
                        }
                        disabled
                      />
                      <FieldItem
                        title={`${translation.sector}:`}
                        value={sector}
                        fieldName="sector"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["sector"]?.toUpperCase() !==
                            sector?.toUpperCase()
                            ? historicalData["sector"]
                            : ""
                        }
                        disabled
                      />
                      <FieldItem
                        title={`${translation.cell}:`}
                        value={cell}
                        fieldName="cell"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["cell"]?.toUpperCase() !==
                            cell?.toUpperCase()
                            ? historicalData["cell"]
                            : ""
                        }
                        disabled
                      />
                      <FieldItem
                        title={`${translation.village}:`}
                        value={village}
                        fieldName="village"
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["village"]?.toUpperCase() !==
                            village?.toUpperCase()
                            ? historicalData["village"]
                            : ""
                        }
                        disabled
                      />
                    </List>
                  </Card>
                  {residentialCountry?.name && (
                    <>
                      <br />
                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                        header={
                          <Text className="textBold textPrimary">
                            {translation.residential_address}
                          </Text>
                        }
                      >
                        <List>
                          <FieldItem
                            title={`${translation.country}:`}
                            value={residentialCountry?.name}
                            fieldName="residentialCountry"
                            disabled
                          />
                          <FieldItem
                            title={`${translation.province}:`}
                            value={residentialProvince?.name}
                            fieldName="residentialProvince"
                          />
                          <FieldItem
                            title={`${translation.district}:`}
                            value={residentialDistrict?.name}
                            fieldName="residentialDistrict"
                          />
                          <FieldItem
                            title={`${translation.sector}:`}
                            value={residentialSector?.name}
                            fieldName="residentialSector"
                          />
                          <FieldItem
                            title={`${translation.cell}:`}
                            value={residentialCell?.name}
                            fieldName="residentialCell"
                          />
                          <FieldItem
                            title={`${translation.village}:`}
                            value={residentialVillage?.name}
                            fieldName="residentialVillage"
                          />
                          <FieldItem
                            title={`${translation.street_house_number}:`}
                            value={address}
                            fieldName="address"
                          />
                        </List>
                      </Card>
                    </>
                  )}
                  <br />
                  <Card
                    styles={{
                      border: "1px solid var(--rs-gray-100)",
                    }}
                    header={
                      <Text className="textBold textPrimary">
                        {translation.father_information}
                      </Text>
                    }
                  >
                    <List>
                      <FieldItem
                        title={`${translation.father_id_number}:`}
                        value={
                          lgType
                            ? originalFatherIDNumber
                            : fatherInfo?.idNumber || fatherIDNumber
                        }
                        fieldName="fatherIDNumber"
                        disabled
                        isDefault={isDefault}
                        isFromLogs={isFromLogs}
                      />
                      <FieldItem
                        title={`${translation.father_name}:`}
                        value={
                          lgType
                            ? originalFatherNames
                            : fatherInfo
                            ? `${fatherInfo?.firstName || ""} ${
                                fatherInfo?.lastName || ""
                              }`
                            : fatherNames
                        }
                        fieldName="fatherNames"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["fatherNames"]
                            ?.toUpperCase()
                            .replace(/\s/g, "") !==
                            fatherNames?.toUpperCase().replace(/\s/g, "")
                            ? historicalData["fatherNames"]
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />
                    </List>
                  </Card>
                  <br />
                  <Card
                    styles={{
                      border: "1px solid var(--rs-gray-100)",
                    }}
                    header={
                      <Text className="textBold textPrimary">
                        {translation.mother_information}
                      </Text>
                    }
                  >
                    <List>
                      <FieldItem
                        title={`${translation.mother_id_number}:`}
                        value={
                          lgType
                            ? originalMotherIDNumber
                            : motherInfo?.idNumber || motherIDNumber
                        }
                        fieldName="motherIDNumber"
                        disabled
                        isDefault={isDefault}
                        isFromLogs={isFromLogs}
                      />

                      <FieldItem
                        title={`${translation.mother_name}:`}
                        value={
                          lgType
                            ? originalMotherNames
                            : motherInfo
                            ? `${motherInfo?.firstName || ""} ${
                                motherInfo?.lastName || ""
                              }`
                            : motherNames
                        }
                        fieldName="motherNames"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["motherNames"]
                            ?.replace(/\s/g, "")
                            ?.toUpperCase() !==
                            motherNames?.replace(/\s/g, "")?.toUpperCase()
                            ? historicalData["motherNames"]
                            : ""
                        }
                        isFromLogs={isFromLogs}
                      />
                    </List>
                  </Card>
                  <br />
                  <Card
                    styles={{
                      border: "1px solid var(--rs-gray-100)",
                    }}
                    header={
                      <Text className="textBold textPrimary">
                        {translation.spouse_information}
                      </Text>
                    }
                  >
                    <List>
                      <FieldItem
                        title={`${translation.spouse_id_number}:`}
                        value={
                          lgType
                            ? originalSpouseIDNumber
                            : spouseInfo?.idNumber || spouseIDNumber
                        }
                        fieldName="spouseIDNumber"
                        disabled
                        isDefault={isDefault}
                      />
                      <FieldItem
                        title={`${translation.spouse}:`}
                        value={
                          lgType
                            ? originalSpouseName
                            : spouseInfo
                            ? `${spouseInfo?.firstName || ""} ${
                                spouseInfo?.lastName || ""
                              }`
                            : spouse
                        }
                        fieldName="spouse"
                        isDefault={isDefault}
                        handleCheckbox={handleCheckbox}
                        selectedInformation={selectedInformation}
                        redFlagsInfo={redFlags}
                        prevInfo={
                          historicalData &&
                          historicalData["spouse"]
                            ?.replace(/\s/g, "")
                            ?.toUpperCase() !==
                            spouse?.replace(/\s/g, "")?.toUpperCase()
                            ? historicalData["spouse"]
                            : ""
                        }
                      />
                    </List>
                  </Card>
                  {legalGuardianIdentifier && (
                    <>
                      <br />

                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                        header={
                          <Text className="textBold textPrimary">
                            {translation.legal_guardian_information}
                          </Text>
                        }
                      >
                        <List>
                          <FieldItem
                            title={`${guardianRelationship} (${translation.name}):`}
                            value={legalGuardianName}
                            fieldName="legalGuardianName"
                            disabled
                            isDefault={isDefault}
                          />

                          <FieldItem
                            title={`${guardianRelationship} (${translation.id_number}):`}
                            value={legalGuardianIdentifier}
                            fieldName="legalGuardianIdentifier"
                            disabled
                            isDefault={isDefault}
                          />

                          {guardianStatus && (
                            <FieldItem
                              title={`${translation.relationship_with_guardian}:`}
                              value={guardianRelationship}
                              fieldName="guardianStatus"
                              disabled
                              isDefault={isDefault}
                            />
                          )}
                        </List>
                      </Card>
                    </>
                  )}

                  {showContacts && (
                    <>
                      <br />
                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                        header={
                          <Text className="textBold textPrimary">
                            {translation.contact}
                          </Text>
                        }
                      >
                        <List>
                          <FieldItem
                            title={`${translation.phone_number}:`}
                            value={phoneNumber}
                            fieldName="phoneNumber"
                            disabled
                            isDefault={isDefault}
                          />
                        </List>
                        <List>
                          <FieldItem
                            title={`${translation.email}:`}
                            value={email}
                            fieldName="email"
                            disabled
                            isDefault={isDefault}
                          />
                        </List>
                      </Card>
                    </>
                  )}

                  {digitalAmbassador && (
                    <>
                      <br />
                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                        header={
                          <Text className="textBold textPrimary">
                            {translation.prenrolment_officer_information}
                          </Text>
                        }
                      >
                        <List>
                          {/* <FieldItem
                            title={`${translation.id_number}:`}
                            value={digitalAmbassadorNid}
                            fieldName="digitalAmbassadorNid"
                            disabled
                            isDefault={isDefault}
                            // url={`/dashboard/admin/citizen/id-profile/${digitalAmbassadorNid}`}
                          /> */}
                          <FieldItem
                            title={`${translation.names}:`}
                            value={
                              digitalAmbassador.first_name +
                              " " +
                              digitalAmbassador?.last_name
                            }
                            fieldName="digitalAmbassador"
                            disabled
                            isDefault={isDefault}
                          />
                        </List>
                      </Card>
                    </>
                  )}
                  {consentContent && (
                    <>
                      <br />
                      <Card
                        styles={{
                          border: "1px solid var(--rs-gray-100)",
                        }}
                      >
                        <Text>
                          <ReactMarkdown>{consentContent}</ReactMarkdown>
                        </Text>
                      </Card>
                    </>
                  )}
                </div>

                {photoPlacement === "right" && (
                  <div className="col-md-3">
                    <div className="citizen-profile">
                      <img
                        src={
                          photo ||
                          preHistoricalInfo?.nida?.photo ||
                          selfie ||
                          userPhotoPlaceholder
                        }
                      />
                    </div>
                    {showSupportingDocuments &&
                      supportingDocuments?.length > 0 && (
                        <div>
                          <br />
                          <Documents data={supportingDocuments || []} />
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="row mb-4">
                <div className={`col-md-6`}></div>

                <div className={`col-md-6`}></div>
              </div>

              <div className={`col-md-6`}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoCard;
