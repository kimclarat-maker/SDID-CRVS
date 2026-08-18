import React from "react";
import "./styles.css";
import { EmptyType } from "@/types/Empty";
import Icon from "../icon";
import { Text } from "rsuite";

const Empty: React.FC<EmptyType> = ({
  styles,
  icon,
  description,
  title,
  isFullScreen,
  button,
}) => {
  return (
    <div
      className={`${isFullScreen ? "fullscreen" : ""}`}
      style={styles}
      data-testid="empty"
    >
      <center>
        {icon && <Icon name={icon} styles={{ fontSize: 30 }} />}
        <center className="empty-activity-description-container">
          <Text className="text-bold mb-3">{title}</Text>
          {description && <Text className="mb-1">{description}</Text>}
          {button}
        </center>
      </center>
    </div>
  );
};

export default Empty;
