import InfoCard from "@/components/infoCard";
import { LanguageContext } from "@/context/LanguageContext";
import moment from "moment";
import React, { useContext } from "react";
import {
  Header,
  List,
  Panel,
  PanelGroup,
  Text,
  TagGroup,
  Tag,
  Stack,
} from "rsuite";

function LogInfo({ data }: { data: any }) {
  const { translation } = useContext(LanguageContext);

  const renderNestedObject = (nestedData: any) => {
    if (typeof nestedData !== "object") return null;

    return (
      <List>
        {Object.keys(nestedData || {}).map((key) => {
          const value = nestedData[key];
          return (
            <List.Item key={key}>
              {key}:{" "}
              {typeof value === "string" ? value : renderNestedObject(value)}
            </List.Item>
          );
        })}
      </List>
    );
  };

  return (
    <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
      <Header>
        <Stack>
          {translation.action}:
          <Stack.Item>
            <TagGroup>
              <Tag
                color={
                  data.action === "delete"
                    ? "red"
                    : data.action === "transfer"
                    ? "green"
                    : "cyan"
                }
              >
                {data.action}
              </Tag>
            </TagGroup>
          </Stack.Item>
        </Stack>
      </Header>
      <Text>
        {translation.type}: {data.type}
      </Text>
      <Text>
        {translation.posted_date}:{" "}
        {moment(data.postedDate).format("YYYY-MM-DD HH:mm")}
      </Text>
      <br />
      <PanelGroup accordion bordered>
        {data.data && (
          <Panel header="Data">
            <InfoCard {...data?.data?.body} />
          </Panel>
        )}
        {data.oldData && (
          <Panel header="Old Data">
            <InfoCard {...data?.oldData} />
          </Panel>
        )}
        {data.newData && (
          <Panel header="New Data">
            <List>
              <InfoCard {...data?.newData} />
            </List>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
}

export default LogInfo;
