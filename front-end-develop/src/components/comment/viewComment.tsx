import Icon from "@/components/icon";
import { LanguageContext } from "@/context/LanguageContext";
import React, { useContext } from "react";
import { IconButton, Panel, Stack } from "rsuite";

interface Props {
  comment: any;
  enableClearComment?: boolean;
  setComment?: (comment: any) => void;
}

const ViewComment: React.FC<Props> = ({
  comment,
  enableClearComment,
  setComment,
}) => {
  const { translation } = useContext(LanguageContext);
  if (!comment || comment === "") return <></>;
  return (
    <>
      <Panel bordered>
        <Stack spacing={6}>
          <Stack.Item>
            <Icon name="message" styles={{ marginTop: ".5rem" }} />
          </Stack.Item>
          <Stack.Item grow={1}>
            {comment?.label || comment?.value || comment}
          </Stack.Item>
          {enableClearComment && (
            <Stack.Item>
              <IconButton
                icon={<Icon name="close" />}
                text={translation.remove}
                onClick={() => setComment && setComment(null)}
                appearance="primary"
                color="red"
              />
            </Stack.Item>
          )}
        </Stack>
      </Panel>
      <br />
    </>
  );
};

export default ViewComment;
