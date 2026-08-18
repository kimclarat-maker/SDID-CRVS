import React from "react";
import "./styles.css";
import { Modal as AppModal, Text } from "rsuite";

const Modal = ({
  title,
  show,
  handleClose,
  size,
  children,
  backdrop,
  role,
  description,
  isBlur,
  testId,
}: {
  title?: string | React.ReactNode;
  show: boolean;
  handleClose?: () => void;
  size?: "lg" | "sm" | "xl" | "xs" | undefined;
  children: React.ReactNode;
  headerStyle?: React.CSSProperties;
  backdrop?: boolean | "static" | undefined;
  role?: string;
  description?: string;
  isBlur?: boolean;
  testId?: string;
}) => (
  <AppModal
    size={size}
    open={show}
    onClose={handleClose}
    backdrop={backdrop}
    role={role}
    overflow
    style={
      isBlur
        ? {
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)", // Note: camelCase in React
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }
        : {}
    }
    data-testid={testId}
  >
    {title && (
      <AppModal.Header>
        <AppModal.Title>
          <div>
            <Text className="textBold">{title}</Text>
          </div>
        </AppModal.Title>

        {description && (
          <Text muted style={{ fontSize: 14 }}>
            {description}
          </Text>
        )}
      </AppModal.Header>
    )}
    {children}
  </AppModal>
);

export default Modal;
