import React from "react";
import { Checkbox, List, Stack } from "rsuite";

interface Props {
  Firmware: string;
  // "V118.41 L SCAN 500C LT (c) CMT 2010",
  IsReady: boolean;
  Maker: string;
  // "Cross Match Technologies",
  Model: string;
  // "PATROL",
  Name: string;
  // "PATROL (003070504.B2023)",
  SerialNumber: string;
  // "003070504.B2023"
}

const DeviceInfo: React.FC<Props> = (props: Props) => {
  return (
    <List>
      {(Object.keys(props) as (keyof Props)[]).map((el, i) => {
        return (
          <List.Item key={i}>
            <Stack spacing={16} style={{ fontSize: 12 }}>
              <Stack.Item grow={1}>{el}:</Stack.Item>
              <Stack.Item className="textBold">
                {typeof props[el] === "boolean" ? (
                  <Checkbox checked={props[el]} />
                ) : (
                  props[el]
                )}
              </Stack.Item>
            </Stack>
          </List.Item>
        );
      })}
    </List>
  );
};

export default DeviceInfo;
