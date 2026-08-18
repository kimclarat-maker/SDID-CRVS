import { Avatar, Badge, Stack, Tag, TagGroup, Text } from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import React, { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

export const UserInfo = ({
  photo,
  name,
  rightButtonsContent,
  center,
  idNumber,
}: {
  photo?: any;
  name: string;
  rightButtonsContent?: React.ReactNode;
  center?: string;
  idNumber?: string;
}) => {
  const { translation } = useContext(LanguageContext);
  return (
    <>
      <Stack spacing={8}>
        <Stack.Item>
          <Avatar src={photo || userImagePlaceholder} circle size="sm" />
        </Stack.Item>
        <Stack.Item grow={1}>
          <Text className="textBold textPrimary">{name}</Text>
          <Text className="textBold">{center}</Text>
          {idNumber && <Text>{idNumber}</Text>}
          <TagGroup>
            <Tag>
              <Text>{translation.active}</Text>
            </Tag>
          </TagGroup>
        </Stack.Item>
        <Stack.Item>{rightButtonsContent}</Stack.Item>
      </Stack>
    </>
  );
};
