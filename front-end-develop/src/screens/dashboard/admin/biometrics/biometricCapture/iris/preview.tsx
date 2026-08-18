import React, { useContext } from "react";
import IrisCapture from "./iris";
import { LanguageContext } from "@/context/LanguageContext";

interface Props {
  canvasRefs?: any;
  irisData?: any;
}

const PreviewIris: React.FC<Props> = ({ canvasRefs, irisData }) => {
  const { translation } = useContext(LanguageContext);
  return (
    <>
      <div className="row">
        <IrisCapture
          size={6}
          title={translation.right_eye}
          canvasRef={canvasRefs?.[1]}
          image={irisData?.rightIris}
        />
        <IrisCapture
          size={6}
          title={translation.left_eye}
          canvasRef={canvasRefs?.[0]}
          image={irisData?.leftIris}
        />
      </div>
    </>
  );
};

export default PreviewIris;
