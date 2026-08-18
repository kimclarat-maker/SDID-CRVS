import { useEffect, useState } from "react";
import { ButtonToolbar, IconButton, Loader } from "rsuite";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import "./styles.css";
import Icon from "../icon";
import useDeleteFile from "@/hooks/useDeleteFile";
import api from "@/api";
import { cfg } from "@/constants/cfg";
interface Props {}

interface Props {
  url: string;
  index: number;
  showDelete?: boolean;
  referenceType?: string;
  files?: any;
  setFiles?: (f: any) => void;
  referenceId?: string;
  file?: any;
}

const PreviewImageOrPdf = ({
  url,
  index,
  showDelete,
  referenceType,
  setFiles,
  referenceId,
  files,
  file,
}: Props) => {
  const [loader, setLoader] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const { deleteFile, deleting, deleteIndex } = useDeleteFile();
  const [contentType, setContentType] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecureFile = async () => {
      try {
        const user = await getStorage();
        setLoader(true);
        let headers: any = {
          Authorization: `Bearer ${user.token}`,
        };

        if (cfg.VITE_API_KEY) {
          headers["x-sdid-api-key"] = cfg.VITE_API_KEY;
        }

        if (cfg.VITE_API_SECRET_KEY) {
          headers["x-sdid-api-secret-key"] = cfg.VITE_API_SECRET_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const contentType = response.headers.get("content-type");

        setContentType(contentType);
        setPreview(objectUrl);
      } catch (error: any) {
        toastMessage(
          "error",
          error.message || "An error occurred while fetching the file"
        );
      } finally {
        setLoader(false);
      }
    };

    fetchSecureFile();
  }, [url]);

  const handleDeleteFile = (file: any, index: number) => {
    const updated = files.filter((f: any) => f.id !== file.id);
    setFiles?.(updated);

    if (!referenceType) return;

    deleteFile({
      referenceId,
      mediaId: file.id,
      referenceType,
      index,
    });
  };

  if (loader) {
    return <Loader center content="Loading..." />;
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="preview-img-pdf">
      <div className="actual-attach">
        {contentType?.includes("pdf") ? (
          <iframe
            src={preview}
            width="100%"
            height="80"
            title={`secure-pdf-${index}`}
            style={{ border: "none" }}
          />
        ) : (
          <img
            src={preview}
            alt={`secure-image-${index}`}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
      </div>
      <div className="preview-footer">
        <ButtonToolbar>
          <IconButton
            icon={<Icon name="download" />}
            onClick={() => window.open(preview?.blobUrl, "_blank")}
          />
          {showDelete && (
            <IconButton
              onClick={() => handleDeleteFile(file, index)}
              loading={deleting && deleteIndex === index}
              icon={<Icon name="delete" />}
            />
          )}
        </ButtonToolbar>
      </div>
    </div>
  );
};

export default PreviewImageOrPdf;
