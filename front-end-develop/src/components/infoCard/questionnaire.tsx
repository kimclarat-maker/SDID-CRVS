import React, { useContext } from "react";
import CheckboxGroup from "../checkbox/group";
import { LanguageContext } from "@/context/LanguageContext";

function Questionnaire({
  isTakeAction,
  handleActionChange,
  isInformationCorrect,
  labelStyles,
  containerStyles,
}: {
  isTakeAction?: boolean;
  handleActionChange?: (e: any) => void;
  isInformationCorrect?: boolean | string;
  containerStyles?: React.CSSProperties;
  labelStyles?: React.CSSProperties;
}) {
  const { translation } = useContext(LanguageContext);

  if (!isTakeAction) return <></>;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* <CheckboxGroup
        name={translation.this_information_is_correct}
        disabled={isTakeAction ? false : true}
        group={[
          {
            label: translation.yes,
            value: "yes",
          },
          {
            label: translation.no,
            value: "no",
          },
        ]}
        styles={containerStyles}
        labelStyles={labelStyles}
        onChange={(e) =>
          handleActionChange
            ? handleActionChange(e)
            : console.log(`handleActionChange(e) not responding`)
        }
        // value={isInformationCorrect + ""}
      /> */}
    </div>
  );
}

export default Questionnaire;
