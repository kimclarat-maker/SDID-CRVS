import React from "react";
import "./styles.css";
import { Heading, Panel, Text } from "rsuite";
import useScreenSize from "@/hooks/useScreenSize";

export default function FormLayout({
  title,
  description,
  image,
  children,
  size,
  titleStyle,
  headerStyle,
  titleContainerStyle,
  noPanel,
}: {
  title?: string;
  description?: string | React.ReactNode;
  image?: string | null;
  children: React.ReactNode;
  size?: number;
  titleStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  titleContainerStyle?: React.CSSProperties;
  noPanel?: boolean;
}) {
  const { isTablet, isPhone } = useScreenSize();
  return (
    <div
      data-testid="form-layout"
      style={isPhone || isTablet ? { padding: "1.5rem" } : { padding: "4rem" }}
    >
      <div className="formContainer">
        <div className={`col-md-${size || 3} mx-auto`}>
          <div className="headerContainer" style={headerStyle}>
            {image && (
              <div className="imageContainer">
                <img src={image} />
              </div>
            )}

            <div className="titleContainer" style={titleContainerStyle}>
              <Heading level={3} style={titleStyle} data-testid="title">
                {title}
              </Heading>
              {description && (
                <Text
                  muted
                  style={{ marginTop: "1rem" }}
                  data-testid="description"
                >
                  {description}
                </Text>
              )}
            </div>
          </div>
          <div className="formBody" data-testid="form-content">
            {noPanel ? (
              <>{children}</>
            ) : (
              <Panel style={{ backgroundColor: "var(--light)" }}>
                {children}
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
