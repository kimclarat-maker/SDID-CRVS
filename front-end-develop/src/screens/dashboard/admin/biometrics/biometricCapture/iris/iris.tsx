import { getMediaById } from "@/api/media";
import Card from "@/components/card";
import { LanguageContext } from "@/context/LanguageContext";
import toastMessage from "@/utils/common/toastMessage";
import { isUUID } from "@/utils/common/uuid";
import React, { Ref, useContext, useEffect, useState } from "react";
import { Text } from "rsuite";

interface Props {
  size?: number;
  title?: string;
  canvasRef?: Ref<HTMLCanvasElement>;
  image?: any;
}

const IrisCapture: React.FC<Props> = ({ size, title, canvasRef, image }) => {
  const [preview, setPreview] = useState<any>(null);
  useEffect(() => {
    try {
      if (image && isUUID(image)) {
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

  const renderHeaders = () => {
    return <Text className="textPrimary textBold">{title}</Text>;
  };

  return (
    <div className={`col-md-${size} iris-image-container`}>
      <Card
        header={renderHeaders()}
        styles={{
          backgroundColor: "var(--rs-gray-900)",
        }}
      >
        {preview ? (
          <img src={preview} style={{ width: "100%", height: "100%" }} />
        ) : (
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
        )}
      </Card>
    </div>
  );
};

export default IrisCapture;
