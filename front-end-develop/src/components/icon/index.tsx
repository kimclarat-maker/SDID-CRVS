import { IconType } from "@/types/Icon";
import React from "react";
import "./styles.css";

const Icon: React.FC<IconType> = ({ name, styles, testId }) => {
  return (
    <span
      data-testid={testId}
      className="material-symbols-outlined icon"
      style={styles}
    >
      {name}
    </span>
  );
};

export default Icon;
