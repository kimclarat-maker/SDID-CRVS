import "./styles.css";
import Icon from "@/components/icon";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Checkbox from "@/components/checkbox";
import Button from "../button";
import { Text } from "rsuite";

function Header({
  title,
  institution,
  handleShowInfo,
  show,
  isCheckedAll,
  handleCheckAll,
  handleNext,
  showRightContent,
}: {
  title: string;
  institution?: string | undefined;
  takeAction?: boolean;
  showTakeAction?: boolean;
  handleShowInfo?: (e: any) => void;
  show?: boolean;
  takeActionActive?: boolean;
  onTakeAction?: (e: any) => void;
  handleCheckAll?: (e: any) => void;
  isCheckedAll?: boolean;
  handleNext?: () => void;
  showRightContent?: boolean;
}) {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="header">
      <div className="left" onClick={handleShowInfo}>
        {/* <Icon name={`arrow_drop_${show ? "down" : "up"}`} />
        <Text className="textBold textPrimary">
          {title}{" "}
          {institution && <span className="textBold">{institution}</span>}
        </Text> */}
      </div>
      {/* {showRightContent && (
        <div className="right">
          <Checkbox
            name="all"
            label={translation.select_all}
            checked={isCheckedAll}
            onChange={handleCheckAll}
          />
          <Button text={translation.next} onClick={() => handleNext} /> removed
        </div>
      )} */}
      <div className="right">
        <Checkbox
          name="all"
          label={translation.select_all}
          checked={isCheckedAll}
          onChange={handleCheckAll}
          labelClassName="textPrimary textBold"
        />
      </div>
    </div>
  );
}

export default Header;
