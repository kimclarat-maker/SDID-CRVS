import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useState } from "react";
import Button from "@/components/button";
import "./styles.css";
import { ButtonToolbar, IconButton, List, Panel, Stack, Text } from "rsuite";
import useDownloadFile from "@/hooks/useDownloadFile";
import capitalizeText from "@/utils/common/capitalizeText";
import Modal from "@/components/Modal";
import Loading from "@/components/loader";
import Icon from "@/components/icon";
import useDeleteFile from "@/hooks/useDeleteFile";
import { apiHandler } from "@/api";

function Documents({
  data,
  setFiles,
  showDelete,
  referenceType,
  referenceId,
}: {
  data: any[];
  setFiles?: (files: any) => void;
  showDelete?: boolean;
  referenceType?: any;
  referenceId?: string;
}) {
  const { translation } = useContext(LanguageContext);
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState("");
  const { fetchFile, filePreviewUrl, loading, index } = useDownloadFile();
  const { deleteFile, deleting, deleteIndex } = useDeleteFile();
  const [url, setUrl] = useState();

  useEffect(() => {
    const readURL = async () => {
      const apiUrl = await apiHandler();

      setUrl(apiUrl);
    };

    readURL();
  }, []);

  const handlePreview = async (doc: any, i: number) => {
    await fetchFile(
      doc.url ? url + "" + doc.url : url + "/media/" + (doc.id || doc._id),
      i
    );
    setTitle(capitalizeText(doc.name));
    setOpenModal(true);
  };

  const removeFile = async (index: number, doc: any) => {
    setFiles &&
      setFiles((prev: any[]) => prev.filter((_, i: number) => i !== index));

    await deleteFile({
      referenceId,
      mediaId: doc._id || doc.id,
      referenceType,
      index,
    });

    console.log("Deleted");
  };

  const DocumentGrid = ({ documents }: { documents: any[] }) => {
    if (documents?.length === 0) return null;

    return (
      <List bordered>
        {documents?.map((doc, i) => (
          <List.Item key={doc.id}>
            <Stack spacing={16}>
              <Stack.Item>
                <IconButton icon={<Icon name="description" />} />
              </Stack.Item>
              <Stack.Item grow={1}>
                {doc.fieldName && <Text>{translation[doc.fieldName]}</Text>}
                <Text
                  className="textBold"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {capitalizeText(doc.name)}
                </Text>
              </Stack.Item>
              <Stack.Item>
                <ButtonToolbar>
                  <Button
                    startIcon="visibility"
                    onClick={() => handlePreview(doc, i)}
                    loading={loading && i === index}
                    appearance="subtle"
                    size="sm"
                  />
                  {showDelete && (
                    <Button
                      startIcon="close"
                      onClick={() => removeFile(i, doc)}
                      loading={deleting && i === deleteIndex}
                      appearance="subtle"
                      size="sm"
                    />
                  )}
                </ButtonToolbar>
              </Stack.Item>
            </Stack>
          </List.Item>
        ))}
      </List>
    );
  };

  return (
    <>
      <DocumentGrid documents={data} />
      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        title={title || translation.supporting_documents}
        size="lg"
      >
        {loading ? (
          <Loading isFullScreen />
        ) : (
          <div className="preview-container">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                className="preview-image"
                onError={(e) => {
                  // Fallback to rendering as a PDF if the image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none"; // Hide the broken image
                  const iframe = document.createElement("iframe");
                  iframe.src = filePreviewUrl;
                  iframe.title = title;
                  iframe.className = "preview-frame";
                  target.parentElement?.appendChild(iframe);
                }}
              />
            ) : (
              <p>No preview available</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default Documents;
