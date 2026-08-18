import { getMediaById } from "@/api/media";
import toastMessage from "@/utils/common/toastMessage";
import { isUUID } from "@/utils/common/uuid";
import React, { useEffect, useState } from "react";

interface Props {
  image: string;
  styles?: React.CSSProperties;
}

const PreviewSignature: React.FC<Props> = ({ image, styles }) => {
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    try {
      if (!isUUID(image)) {
        setPreview(image);
      } else if (isUUID(image)) {
        const getBase64 = async () => {
          const data = await getMediaById({ mediaId: image });

          setPreview(`data:image/jpeg;base64,${data}`);
        };

        getBase64();
      }
    } catch (error) {
      toastMessage("error", error);
    }
  }, [image]);

  // if (!preview) return <div>No Signature</div>;
  return <img style={styles} id="signatureImage" src={preview} />;
};

export default PreviewSignature;
