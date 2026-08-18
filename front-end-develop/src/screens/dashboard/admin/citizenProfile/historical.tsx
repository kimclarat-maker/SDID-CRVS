import Alert from "@/components/alert";
import Card from "@/components/card";
import Empty from "@/components/empty";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import {
  useFetchEnrollmentBiometricById,
  useFetchEnrollmentBiometricHistory,
} from "@/hooks/useFetchEnrollments";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  List,
  Panel,
  PanelGroup,
  Stack,
  Text,
  Nav,
  Tag,
  TagGroup,
  Badge,
} from "rsuite";
import PreviewFingerprint from "../biometrics/biometricCapture/fingerprint/preview";
import PreviewIris from "../biometrics/biometricCapture/iris/preview";
import PreviewSelfie from "../biometrics/biometricCapture/selfie/preview";
import Button from "@/components/button";
import PreviewSignature from "../biometrics/biometricCapture/signature/preview";
import moment from "moment";
import Modal from "@/components/Modal";
import CustomTabs from "@/components/tabs";

const Biometric = ({
  enrollmentId,
  id,
  type,
}: {
  enrollmentId: string;
  id: string;
  type: string;
}) => {
  const { translation } = useContext(LanguageContext);
  const { data, fetchEnrollmentData, loading } =
    useFetchEnrollmentBiometricById();

  useEffect(() => {
    fetchEnrollmentData({
      [type]: id,
      enrollmentId,
    });
  }, [type, id, enrollmentId]);

  const mainStyles = {
    minHeight: 80,
  };

  if (loading) return <Loading isFullScreen />;
  if (data?.length === 0)
    return (
      <Empty styles={mainStyles} title={translation.no_data} isFullScreen />
    );

  let irisData = {};

  if (data.iris && data.iris.preview) {
    irisData = JSON.parse(data.iris.preview);
  }

  const croppedFace = () => {
    try {
      if (data.face && data.face.preview) {
        let parse = JSON.parse(data.face.preview);
        console.log(parse);

        return parse;
      }
    } catch (error) {
      return null;
    }
  };

  return (
    <>
      <div>
        {type === "faceId" && data?.face && data?.face?.preview ? (
          <CustomTabs
            options={[
              {
                title: translation.cropped_image,
                data: (
                  <Panel className="face-preview-panel">
                    <div className="face-preview-container">
                      {/* Main Image Section */}
                      <center>
                        <PreviewSelfie
                          image={croppedFace()?.photo}
                          styles={{ width: "50%", borderRadius: "1rem" }}
                        />
                      </center>
                      <br />

                      {/* ICAO Attributes Section - Only show if attributes exist */}
                      {croppedFace()?.icaoAttributes && (
                        <div className="attributes-section">
                          <PanelGroup
                            accordion
                            bordered
                            className="attributes-panel-group"
                          >
                            {/* Failed Attributes */}
                            <Panel
                              header={
                                <div className="panel-header">
                                  <span>{translation.failed}</span>
                                  {croppedFace()?.icaoAttributes?.failed && (
                                    <Badge
                                      content={
                                        croppedFace()?.icaoAttributes?.failed
                                          ?.length
                                      }
                                    />
                                  )}
                                </div>
                              }
                              eventKey={1}
                              className="failed-panel"
                            >
                              <TagGroup className="attributes-tag-group">
                                {croppedFace()?.icaoAttributes?.failed?.map(
                                  (item: string, i: number) => (
                                    <Tag
                                      color="red"
                                      key={i}
                                      className="attribute-tag"
                                    >
                                      {item}
                                    </Tag>
                                  )
                                )}
                              </TagGroup>
                            </Panel>

                            {/* Passed Attributes */}
                            <Panel
                              header={
                                <div className="panel-header">
                                  <span>{translation.passed}</span>
                                  {croppedFace()?.icaoAttributes?.passed && (
                                    <Badge
                                      content={
                                        croppedFace()?.icaoAttributes?.passed
                                          ?.length
                                      }
                                    />
                                  )}
                                </div>
                              }
                              eventKey={2}
                              className="passed-panel"
                            >
                              <TagGroup className="attributes-tag-group">
                                {croppedFace()?.icaoAttributes?.passed?.map(
                                  (item: string, i: number) => (
                                    <Tag
                                      color="green"
                                      key={i}
                                      className="attribute-tag"
                                    >
                                      {item}
                                    </Tag>
                                  )
                                )}
                              </TagGroup>
                            </Panel>
                          </PanelGroup>
                        </div>
                      )}
                    </div>
                  </Panel>
                ),
              },
              {
                title: translation.full_image,
                data: (
                  <Panel
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <PreviewSelfie
                      image={data?.face?.face}
                      styles={{ borderRadius: 8 }}
                    />
                  </Panel>
                ),
              },
            ]}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <PreviewSelfie
              image={data?.face?.face}
              styles={{ borderRadius: 8 }}
            />
          </div>
        )}
      </div>

      {type === "irisId" && data.iris && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PreviewIris irisData={irisData} />
        </div>
      )}

      {type === "fingerprintId" && data.fingerprint && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PreviewFingerprint fingerData={data?.fingerprint} />
        </div>
      )}

      {type === "signatureId" && data.signature && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PreviewSignature image={data?.signature?.signature} />
        </div>
      )}
    </>
  );
};

const Historical = () => {
  const { id } = useParams();
  const { translation } = useContext(LanguageContext);
  const { data, fetchEnrollmentData, loading } =
    useFetchEnrollmentBiometricHistory();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedBioId, setSelectedBioId] = useState<string>("");
  const [modalTitle, setModalTitle] = useState<string>("");
  const [selectedBioType, setSelectedBioType] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    fetchEnrollmentData(id);
  }, [id]);

  if (loading) return <Loading isFullScreen />;

  if (!id)
    return (
      <Alert type="error">{translation.missing_field}: Enrollment Id</Alert>
    );

  if (!data || Object.keys(data)?.length === 0)
    return <Empty title={translation.no_data} />;

  return (
    <>
      <PanelGroup accordion>
        <Card>
          <Panel
            eventKey="face"
            header={
              <Stack>
                <Stack.Item grow={1}>
                  <Text
                    className="textPrimary textBold"
                    style={{ textTransform: "uppercase" }}
                  >
                    {translation.photo} ({data?.face?.length})
                  </Text>
                </Stack.Item>
              </Stack>
            }
          >
            <List bordered>
              {data?.face?.map((el: any, i: number) => {
                return (
                  <List.Item key={i}>
                    <Stack spacing={16} alignItems="center">
                      <Stack.Item>
                        <Text>{moment(el.postedDate).format("lll")}</Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          text={translation.view}
                          onClick={() => {
                            setSelectedBioId(el._id);
                            setSelectedBioType("faceId");
                            setModalTitle(translation.photo);
                            setOpenModal(true);
                          }}
                          size="sm"
                        />
                      </Stack.Item>
                    </Stack>
                  </List.Item>
                );
              })}
            </List>
          </Panel>
        </Card>
        <br />
        <Card>
          <Panel
            eventKey="iris"
            header={
              <Stack>
                <Stack.Item grow={1}>
                  <Text
                    className="textPrimary textBold"
                    style={{ textTransform: "uppercase" }}
                  >
                    {translation.iris} ({data?.iris?.length})
                  </Text>
                </Stack.Item>
              </Stack>
            }
          >
            <List bordered>
              {data?.iris?.map((el: any, i: number) => {
                return (
                  <List.Item key={i}>
                    <Stack spacing={16} alignItems="center">
                      <Stack.Item>
                        <Text>{moment(el.postedDate).format("lll")}</Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          text={translation.view}
                          onClick={() => {
                            setSelectedBioId(el._id);
                            setSelectedBioType("irisId");
                            setModalTitle(translation.iris);
                            setOpenModal(true);
                          }}
                          size="sm"
                        />
                      </Stack.Item>
                    </Stack>
                  </List.Item>
                );
              })}
            </List>
          </Panel>
        </Card>

        <br />
        <Card>
          <Panel
            eventKey="fingerprint"
            header={
              <Stack>
                <Stack.Item grow={1}>
                  <Text
                    className="textPrimary textBold"
                    style={{ textTransform: "uppercase" }}
                  >
                    {translation.fingerprint} ({data?.fingerprint?.length})
                  </Text>
                </Stack.Item>
              </Stack>
            }
          >
            <List bordered>
              {data?.fingerprint?.map((el: any, i: number) => {
                return (
                  <List.Item key={i}>
                    <Stack spacing={16} alignItems="center">
                      <Stack.Item>
                        <Text>{moment(el.postedDate).format("lll")}</Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          text={translation.view}
                          onClick={() => {
                            setSelectedBioId(el._id);
                            setSelectedBioType("fingerprintId");
                            setModalTitle(translation.fingerprint);
                            setOpenModal(true);
                          }}
                          size="sm"
                        />
                      </Stack.Item>
                    </Stack>
                  </List.Item>
                );
              })}
            </List>
          </Panel>
        </Card>

        <br />
        <Card>
          <Panel
            eventKey="signature"
            header={
              <Stack>
                <Stack.Item grow={1}>
                  <Text
                    className="textPrimary textBold"
                    style={{ textTransform: "uppercase" }}
                  >
                    {translation.signature} ({data?.signature?.length})
                  </Text>
                </Stack.Item>
              </Stack>
            }
          >
            <List bordered>
              {data?.signature?.map((el: any, i: number) => {
                return (
                  <List.Item key={i}>
                    <Stack spacing={16} alignItems="center">
                      <Stack.Item>
                        <Text>{moment(el.postedDate).format("lll")}</Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          text={translation.view}
                          onClick={() => {
                            setSelectedBioId(el._id);
                            setSelectedBioType("signatureId");
                            setModalTitle(translation.signature);
                            setOpenModal(true);
                          }}
                          size="sm"
                        />
                      </Stack.Item>
                    </Stack>
                  </List.Item>
                );
              })}
            </List>
          </Panel>
        </Card>
      </PanelGroup>

      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        title={modalTitle}
      >
        <Biometric
          enrollmentId={id}
          id={selectedBioId}
          type={selectedBioType}
        />
      </Modal>
    </>
  );

  return <Stack spacing={32}></Stack>;
};

export default Historical;
