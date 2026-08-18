import { apiHandler } from "@/api";
import Button from "@/components/button";
import Documents from "@/components/documents";
import Icon from "@/components/icon";
import Loading from "@/components/loader";
import Modal from "@/components/Modal";
import PreviewImageOrPdf from "@/components/previewImagePdf";
import { fieldsSupportDocument } from "@/constants/citizenInfoRequiredFields";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchSupportingDocumentsByField } from "@/hooks/useSupportingDocument";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import toastMessage from "@/utils/common/toastMessage";
import {
  useState,
  useRef,
  ChangeEvent,
  useContext,
  useEffect,
  useCallback,
} from "react";
import Webcam from "react-webcam";
import {
  Card as RCard,
  List,
  Stack,
  Text,
  Grid,
  Row,
  Col,
  IconButton,
  ButtonToolbar,
  Modal as LibModal,
} from "rsuite";
import SelectDropdown from "../select";
import { defineAccess } from "@/utils/common/permissions";

interface Props {
  setFiles?: (files: any) => void;
  referenceId?: string;
  referenceType?: string;
  files: any;
  showUploadButton?: boolean;
  enrollmentId?: string;
  name?: string;
  biometricData?: any;
  showDelete?: boolean;
  setComment?: (f: any) => void;
  enableCapture?: boolean;
  comment?: string;
  listComments?: any[];
}

const Upload = ({
  setFiles,
  files,
  referenceType,
  referenceId,
  showUploadButton,
  name,
  biometricData,
  showDelete,
  comment,
  setComment,
  enableCapture,
  listComments,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const { translation } = useContext(LanguageContext);
  const { loadingUpload, handleUploadMedia } = useUploadMedia();
  const [documentsRequired, setDocumentsRequired] = useState<any[]>([]);
  const { loading: loadingSD, fetchSupportingDocumentsByFieldData } =
    useFetchSupportingDocumentsByField();
  const [apiUrl, setApiUrl] = useState<string | undefined>();
  const [openCamera, setOpenCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<any>();
  const [devices, setDevices] = useState([]);
  const [isUploadingLivePhoto, setUploadingLivePhoto] = useState(false);

  const handleDevices = useCallback((mediaDevices: any) => {
    const videoDevices = mediaDevices.filter(
      ({ kind, label }: { kind: string; label: string }) =>
        kind === "videoinput" && label.includes("AnkerWork")
    );
    const listDevices: any = [];

    videoDevices.forEach((el: any) => {
      const device = {
        ...el,
        label: el.label,
        value: el.deviceId,
      };

      if (el.label.includes("AnkerWork")) {
        // put at the beginning
        listDevices.unshift(device);
      }
    });

    setDevices(listDevices);

    // Set the first camera as default if none is selected
    if (listDevices.length > 0) {
      setDeviceId(listDevices[0]);
    }
  }, []);

  useEffect(() => {
    navigator &&
      navigator.mediaDevices &&
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  useEffect(() => {
    setOpenCamera(false);
    const getApiUrl = async () => {
      const canUseOffline = defineAccess({
        method: "get",
        module: "offline",
      });

      const url = await apiHandler(
        undefined,
        "/media",
        undefined,
        canUseOffline
      );
      setApiUrl(url);
    };
    const fetchDocuments = async () => {
      if (!name || !biometricData) return;

      let formattedDocuments: any[] = [];

      console.log(biometricData);

      if (Object.keys(biometricData).length === 0) return;

      const selectedField = Object.keys(biometricData)[0];

      if (fieldsSupportDocument.includes(selectedField)) {
        const response: any = await fetchSupportingDocumentsByFieldData(
          selectedField
        );

        // if (!response?.documentTypesMultiLang?.length) {
        //   toastMessage(
        //     "warning",
        //     "No document types available for this field: " + field
        //   );
        //   continue;
        // }

        response.documentTypesMultiLang?.forEach((el: any) => {
          let label = el[translation.default] || el.en || "Unnamed";
          formattedDocuments = [
            {
              ...response,
              field: selectedField,
              label,
              value: label,
            },
          ];
        });
      }

      for (const field of Object.keys(biometricData)) {
        if (fieldsSupportDocument.includes(field) && !biometricData[field]) {
          const response: any = await fetchSupportingDocumentsByFieldData(
            field
          );

          // if (!response?.documentTypesMultiLang?.length) {
          //   toastMessage(
          //     "warning",
          //     "No document types available for this field: " + field
          //   );
          //   continue;
          // }

          response.documentTypesMultiLang?.forEach((el: any) => {
            let label = el[translation.default] || el.en || "Unnamed";
            formattedDocuments = [
              {
                ...response,
                field,
                label,
                value: label,
              },
            ];
          });
        }
      }

      setDocumentsRequired(formattedDocuments?.filter((el) => el.isRequired));
      setSelectedField(selectedField);
    };

    getApiUrl();
    fetchDocuments();
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (
        !file ||
        !setFiles ||
        !referenceType ||
        !referenceId ||
        !selectedField
      )
        return;

      const data = await handleUploadMedia(file, referenceType, referenceId);

      const label =
        documentsRequired.find((d) => d.field === selectedField)?.label ||
        file.name;

      if (!data?.data) return;

      const newFile = {
        id: data.data._id,
        name: label,
        field: selectedField,
        originalFileName: file.name,
      };

      if (!files) {
        setFiles([newFile]);
      } else {
        setFiles((prevFiles: any) => [...(prevFiles || []), newFile]);
      }

      setSelectedField(null); // reset after upload
    } catch (error) {
      toastMessage("error", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = (field: string) => {
    setSelectedField(field);
    fileInputRef.current?.click();
  };

  const renderUploadedFile = (doc: any) => {
    const uploadedFilesForField =
      files?.filter(
        (f: any) =>
          f.field === doc.name ||
          doc.documentTypes?.includes(f.name) ||
          f.field === doc.field
      ) || [];
    if (uploadedFilesForField.length === 0) return <></>;
    return (
      <>
        <br />

        <Grid fluid>
          <Row gutter={16}>
            {uploadedFilesForField.map((file: any, idx: number) => {
              const fileUrl = file.url
                ? apiUrl + "" + file.url
                : apiUrl + "/media/" + file.id;

              return (
                <Col key={idx} xs={24} sm={12} md={8} lg={6}>
                  <RCard key={idx} style={{ marginBottom: 16, padding: 10 }}>
                    <PreviewImageOrPdf
                      url={fileUrl}
                      index={idx}
                      showDelete
                      file={file}
                      files={uploadedFilesForField}
                      setFiles={setFiles}
                      referenceId={referenceId}
                      referenceType={referenceType}
                    />
                  </RCard>
                </Col>
              );
            })}
          </Row>
        </Grid>
      </>
    );
  };

  const onTakePhoto = async () => {
    try {
      if (!referenceType || !referenceId) return;
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        setUploadingLivePhoto(true);
        setImage(imageSrc);

        // Convert base64 to a Blob
        const base64Response = await fetch(imageSrc);
        const blob = await base64Response.blob();

        // Create a File object (optional: you can just send the blob)
        const file = new File([blob], "capture.png", { type: "image/png" });
        const data = await handleUploadMedia(file, referenceType, referenceId);

        if (!data?.data) return;

        const label = referenceType + "- LIVE PHOTO";
        const fileName =
          documentsRequired.find((d) => d.field === selectedField)?.label ||
          file.name;

        const newFile = {
          id: data.data._id,
          name: fileName,
          field: selectedField,
          originalFileName: label,
        };

        if (!files) {
          setFiles && setFiles([newFile]);
        } else {
          setFiles &&
            setFiles((prevFiles: any) => [...(prevFiles || []), newFile]);
        }

        setImage(null);
        setOpenCamera(false);
        setUploadingLivePhoto(false);
        setSelectedField(null);
      }
    } catch (error) {
      console.log(error);
      toastMessage("error", error);
    }
  };

  const onRetakePhoto = async () => {
    setImage(null);
  };

  return (
    <div className="rs-modal-body">
      {/* {enableCapture && (
        <SelectDropdown
          options={listComments}
          label={translation.comment}
          placeholder={translation.comment_placeholder}
          name="comment"
          value={comment}
          onChange={(value) => setComment && setComment(value)}
          testId="comment"
          disabled={!enableCapture}
        />
      )} */}
      {loadingSD ? (
        <Loading isFullScreen />
      ) : (
        <div
          className="file-uploader"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            style={{ display: "none" }}
          />
          {showUploadButton ? (
            <List bordered>
              {documentsRequired &&
                Array.isArray(documentsRequired) &&
                documentsRequired?.map((doc, i) => (
                  <List.Item key={`${doc.field}-${i}`}>
                    <Stack spacing={16}>
                      <Stack.Item>
                        <IconButton icon={<Icon name="description" />} />
                      </Stack.Item>
                      <Stack.Item grow={1}>
                        <Text>{doc.label}</Text>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          onClick={() => {
                            setOpenCamera(true);
                            setSelectedField(doc.field);
                          }}
                          text={translation.take_photo}
                          startIcon="camera"
                        />
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          onClick={() => triggerFileInput(doc.field)}
                          text={translation.upload}
                          loading={selectedField === doc.field && loadingUpload}
                          startIcon="add"
                          appearance="default"
                        />
                      </Stack.Item>
                    </Stack>

                    {renderUploadedFile(doc)}
                  </List.Item>
                ))}
            </List>
          ) : (
            <List className="file-list">
              <Documents
                data={files}
                showDelete={showDelete}
                referenceType={referenceType}
                referenceId={referenceId}
                setFiles={setFiles}
              />
            </List>
          )}

          <Modal
            show={openCamera}
            handleClose={() => {
              setOpenCamera(false);
              setImage(null);
            }}
            title={translation.supporting_document_live_photo}
          >
            <div>
              {image ? (
                <>
                  <img src={image} />
                </>
              ) : (
                devices?.length > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      paddingTop: "1rem",
                      borderRadius: 16,
                      position: "relative",
                    }}
                  >
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={1}
                      videoConstraints={{
                        deviceId: deviceId
                          ? { exact: deviceId.value }
                          : undefined,
                        // aspectRatio: 1,
                        width: { ideal: 3840 }, // request 4K width
                        height: { ideal: 2160 },
                      }}
                      style={{
                        width: "100%",
                        height: "30vh",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )
              )}
            </div>
            <br />
            <LibModal.Footer>
              <Stack>
                <Stack.Item grow={1}></Stack.Item>
                <Stack.Item>
                  <ButtonToolbar>
                    {image && (
                      <Button
                        text={translation.retake}
                        onClick={onRetakePhoto}
                        appearance="default"
                      />
                    )}
                    <Button
                      text={translation.take_photo}
                      onClick={onTakePhoto}
                      loading={isUploadingLivePhoto}
                    />
                  </ButtonToolbar>
                </Stack.Item>
              </Stack>
            </LibModal.Footer>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default Upload;
