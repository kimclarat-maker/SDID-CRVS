import Card from "@/components/card";
import React from "react";
import { Panel } from "rsuite";

interface Props {
  image: any;
  styles?: any;
}

const PreviewSelfie: React.FC<Props> = ({ image, styles }) => {
  return (
    <div style={{ textAlign: "center", ...styles }}>
      <img src={image} style={{ borderRadius: "inherit" }} />
    </div>
  );
};

export default PreviewSelfie;
