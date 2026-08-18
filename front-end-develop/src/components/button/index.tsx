import { IconButton, Button as LibButton } from "rsuite";

import Icon from "../icon";
import "./styles.css";

import { ButtonType } from "@/types/Button";
import useScreenSize from "@/hooks/useScreenSize";
import { useContext } from "react";
import { LanguageContext } from "@/context/LanguageContext";

export default function Button({
  text,
  startIcon,
  appearance = "primary",
  onClick,
  endIcon,
  loading,
  size = "md",
  disabled,
  styles,
  testId,
  block,
  color,
  hidden,
  type = "submit",
  download,
}: ButtonType) {
  const { isPhone } = useScreenSize();
  const { translation } = useContext(LanguageContext);

  if (!testId) {
    testId = text;
  }

  const props = {
    onClick: onClick,
    appearance: appearance,
    loading: loading,
    size: size,
    disabled: disabled,
    style: styles,
    hidden: hidden,
    download,
  };

  if (isPhone && startIcon) {
    return (
      <IconButton
        color={color}
        {...props}
        icon={startIcon ? <Icon name={startIcon} /> : <></>}
        data-testid={testId}
        size="sm"
      />
    );
  }
  if (!text || (text === "" && startIcon)) {
    return (
      <IconButton
        color={color}
        {...props}
        icon={startIcon ? <Icon name={startIcon} /> : <></>}
        data-testid={testId}
      />
    );
  }
  return (
    <LibButton
      color={color}
      block={block}
      {...props}
      startIcon={
        startIcon ? <Icon name={startIcon} styles={{ fontSize: 18 }} /> : null
      }
      endIcon={
        endIcon ? <Icon name={endIcon} styles={{ fontSize: 18 }} /> : null
      }
      data-testid={testId}
      type={type}
    >
      {text && text !== "" && text}
    </LibButton>
  );
}
