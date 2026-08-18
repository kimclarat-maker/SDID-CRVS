import React from "react";
import { Dropdown } from "rsuite";

import "../styles.css";
import { DropdownType } from "@/types/Button";
import Icon from "@/components/icon";

const DropdownButton: React.FC<DropdownType> = ({
  title,
  children,
  noCaret,
  className,
  placement = "bottomEnd",
  appearance,
  minWidth = "20vw",
  size,
  startIcon,
  endIcon,
  trigger = "click",
}) => {
  return (
    <Dropdown
      title={title || ""}
      className={`dropdownContainer ${className}`}
      noCaret={noCaret}
      placement={placement}
      appearance={appearance}
      size={size}
      startIcon={startIcon ? <Icon name={startIcon} /> : null}
      endIcon={endIcon ? <Icon name={endIcon} /> : null}
      trigger={trigger || "click"}
    >
      <div style={{ minWidth }}>{children}</div>
    </Dropdown>
  );
};

export default DropdownButton;
