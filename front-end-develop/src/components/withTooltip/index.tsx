import { IconButton, Tooltip, Whisper } from "rsuite";
import Icon from "../icon";
import React from "react";

export const WithTooltip: any = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const tooltip = <Tooltip>{children}</Tooltip>;

  return (
    <div>
      <Whisper
        placement="top"
        controlId="control-id-hover"
        trigger="hover"
        speaker={tooltip}
      >
        <IconButton
          color="red"
          icon={<Icon name="flag" styles={{ color: "red" }} />}
          size="xs"
        />
      </Whisper>
    </div>
  );
};
