import React from "react";
import "./styles.css";
import Icon from "../icon";
import { Text } from "rsuite";

interface Props {
  title: string;
  description: string;
  icon: string;
  button: React.ReactNode;
}

const Success: React.FC<Props> = ({ title, description, icon, button }) => {
  return (
    <div className="success-activity" data-testid="success">
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

export default Success;
