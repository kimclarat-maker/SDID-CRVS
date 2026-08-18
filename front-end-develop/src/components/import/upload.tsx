import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect, useRef, useState } from "react";
import { Modal, Uploader } from "rsuite";
import Button from "../button";
import "./styles.css";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import { UserType } from "@/types/User";
import { apiHandler } from "@/api";
import { FileType } from "rsuite/esm/Uploader";

export const UploadFile = ({
  fileApiUrl,
  handleClose,
  accept,
  refreshData,
  getUploadedFiles,
  maxLength = 1,
}: {
  fileApiUrl: string;
  handleClose?: () => void;
  accept?: string;
  refreshData?: () => void;
  getUploadedFiles?: (res: any) => void;
  maxLength?: number;
}) => {
  const [fileList, setFileList] = useState<FileType[]>([]);
  const uploader = useRef<any>();
  const { translation } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    const getLoggedInUser = async () => {
      const user = await getStorage();

      setUser(user);
    };

    getLoggedInUser();
  }, []);

  const baseURL = "";
  // apiHandler();

  return (
    <>
      <Uploader
        fileList={fileList}
        autoUpload={false}
        action={`${baseURL}${fileApiUrl}`}
        headers={{
          Authorization: `Bearer ${user?.token}`,
        }}
        onChange={setFileList}
        ref={uploader}
        draggable
        accept={accept}
        shouldQueueUpdate={(fileList) => {
          return new Promise((resolve, reject) => {
            if (fileList.length > maxLength) {
              const errorMessage = `Max Length exceeded. only ${maxLength} file(s)`;
              toastMessage("error", errorMessage);
              return reject(errorMessage);
            }

            resolve(true);
          });
        }}
        shouldUpload={(file) => {
          return new Promise((resolve) => {
            resolve(true);
            setLoading(false);
          });
        }}
        onSuccess={(response, file) => {
          toastMessage("success", `${file.name} uploaded successfully.`);
          setLoading(false);
          handleClose && handleClose();
          refreshData && refreshData();
          getUploadedFiles && getUploadedFiles(response);
        }}
        onError={(error, file) => {
          toastMessage("error", `Failed to upload ${file.name}.`);
          setLoading(false);
        }}
      >
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed var(--rs-gray-500)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <span>{translation.click_or_drag_drop}</span>
        </div>
      </Uploader>
      <hr />
      <Modal.Footer>
        <Button
          text={translation.start_upload}
          disabled={!fileList.length}
          onClick={() => {
            setLoading(true);
            uploader.current?.start();
          }}
          loading={loading}
        />
      </Modal.Footer>
    </>
  );
};
