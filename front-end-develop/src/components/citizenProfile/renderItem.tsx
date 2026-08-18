import React from "react";
import { List, Stack, Text } from "rsuite";

interface Props {
  label: string;
  value: string;
}

const RenderItem: React.FC<Props> = ({ label, value }: Props) => {
  return (
    <List.Item>
      <Stack>
        <Stack.Item grow={1}>
          <Text>{label}:</Text>
        </Stack.Item>
        <Stack.Item>
          <Text className="textBold">{value}</Text>
        </Stack.Item>
      </Stack>
    </List.Item>
  );
};

export default RenderItem;
