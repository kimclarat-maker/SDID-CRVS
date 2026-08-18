import { Heading, Stack, Text } from "rsuite";
import "./styles.css";
import React, { ReactNode } from "react";
import { Tag, TagGroup } from "rsuite";

type TagType = {
  name: string;
  value: string | number;
}[];

function Header({
  title,
  titleStyles,
  description,
  headerStyles,
  containerStyles,
  tagsStyles,
  tags,
  image,
  rightContent,
}: {
  titleStyles?: any;
  title: string | ReactNode;
  description?: string;
  headerStyles?: React.CSSProperties;
  containerStyles?: React.CSSProperties;
  tags?: any[];
  tagsStyles?: React.CSSProperties;
  image?: any;
  rightContent?: ReactNode;
}) {
  const renderTags = (tags: TagType) => {
    return (
      <TagGroup>
        {tags.map((tag, i) => {
          return (
            <Tag key={i}>
              <div className="d-flex gap-1">
                <Text>{tag.name + ":"}</Text>
                <Text className="textBold">{tag.value}</Text>
              </div>
            </Tag>
          );
        })}
      </TagGroup>
    );
  };
  return (
    <div style={containerStyles}>
      <Stack>
        <Stack.Item grow={1}>
          <div style={headerStyles}>
            {image && (
              <div className="imageContainer">
                <img src={image} />
              </div>
            )}
            <Heading level={4} className="text-bold" style={titleStyles}>
              {title}
            </Heading>
            {description && (
              <Text muted style={{ marginTop: "0.5rem" }}>
                {description}
              </Text>
            )}
          </div>
          {tags && tags.length > 0 && (
            <Stack spacing={6}>
              <div style={tagsStyles}>{renderTags(tags)}</div>
            </Stack>
          )}
        </Stack.Item>
        <Stack.Item grow={1} />
        <Stack.Item>{rightContent}</Stack.Item>
      </Stack>
    </div>
  );
}

export default Header;
