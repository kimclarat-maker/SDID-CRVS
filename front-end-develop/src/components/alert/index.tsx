import "./styles.css";
import { Message, Text } from "rsuite";

interface AlertType {
  title?: string;
  type?: "info" | "success" | "warning" | "error";
  message?: React.ReactNode;
  centered?: boolean;
  children?: React.ReactNode;
  closable?: boolean;
  styles?: React.CSSProperties;
  showIcon?: boolean;
}

function Alert({
  title,
  type = "warning",
  message,
  centered,
  children,
  closable,
  styles = {},
  showIcon = true,
}: AlertType) {
  return (
    <Message
      showIcon={showIcon}
      type={type}
      header={title}
      centered={centered}
      closable={closable}
      style={{ maxWidth: "100%", wordWrap: "break-word", ...styles }}
    >
      {message}
      {children}
    </Message>
  );
}

export default Alert;
