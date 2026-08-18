import { getMediaById } from "@/api/media";
import toastMessage from "@/utils/common/toastMessage";
import { isUUID } from "@/utils/common/uuid";
import React, { useEffect, useState } from "react";

interface Props {
  image: any;
  styles?: React.CSSProperties;
}

const PreviewSelfie: React.FC<Props> = ({ image, styles }) => {
  const [preview, setPreview] = useState<any>(null);
  useEffect(() => {
    try {
      if (isUUID(image)) {
        const getBase64 = async () => {
          const data = await getMediaById({ mediaId: image });

          setPreview(`data:image/jpeg;base64,${data}`);
        };

        getBase64();
      } else if (!isUUID(image)) {
        setPreview(image);
      }
    } catch (error) {
      toastMessage("error", error);
    }
  }, [image]);

  return (
    <>
      <img src={preview} style={styles} />
    </>
  );
};

export default PreviewSelfie;
