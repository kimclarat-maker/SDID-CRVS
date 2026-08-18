import { useContext, useEffect } from "react";
import "./styles.css";
import useDownloadFile from "@/hooks/useDownloadFile";
import Modal from "@/components/Modal";
import Loading from "@/components/loader";
import { Modal as LibModal } from "rsuite";
import Button from "../button";
import { LanguageContext } from "@/context/LanguageContext";
import { cfg } from "@/constants/cfg";

type DocType = {
  _id: string;
  document: string;
  fieldName?: string;
};

function DocumentPreview({
  doc,
  openModal,
  setOpenModal,
  title,
  yesBtnText,
  handleYesButton,
  yesButtonLoading,
}: {
  doc: DocType;
  openModal: boolean;
  setOpenModal: (b: boolean) => void;
  title: string;
  yesBtnText?: string;
  handleYesButton?: () => void;
  yesButtonLoading?: boolean;
}) {
  const { translation } = useContext(LanguageContext);
  const { fetchFile, filePreviewUrl, loading } = useDownloadFile();
  const apiUrl =
    cfg.VITE_NODE_ENV === "test" ? cfg.VITE_TEST_API : cfg.VITE_DEVELOPMENT_API;

  const handlePreview = async (doc: any) => {
    await fetchFile(
      doc.url ? apiUrl + "" + doc.url : apiUrl + "/media/" + doc._id
    );

    setOpenModal(true);
  };

  useEffect(() => {
    handlePreview(doc);
  }, [doc]);

  return (
    <>
      <Modal
        show={openModal}
        handleClose={() => setOpenModal(false)}
        title={title}
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
        <br />
        <LibModal.Footer>
          <Button
            text={translation.close}
            onClick={() => setOpenModal(false)}
            appearance="default"
          />
          {yesBtnText && (
            <Button
              text={yesBtnText}
              onClick={handleYesButton}
              loading={yesButtonLoading}
            />
          )}
        </LibModal.Footer>
      </Modal>
    </>
  );
}

export default DocumentPreview;
