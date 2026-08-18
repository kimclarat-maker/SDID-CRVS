import { LanguageContext } from "@/context/LanguageContext";
import { ReactNode, useContext } from "react";
import { Panel, Text } from "rsuite";

interface Props {
  children: ReactNode;
  title?: string;
  eventKey?: string;
}

const Card = ({ children, title, eventKey }: Props) => {
  const { translation } = useContext(LanguageContext);
  return (
    <>
      <div className="card">
        <Panel
          eventKey={eventKey}
          header={
            title && (
              <Text className="textPrimary">
                {translation[title]?.toUpperCase()}
              </Text>
            )
          }
        >
          <div className="card-body">{children}</div>
        </Panel>
      </div>
      <br />
    </>
  );
};

export default Card;
