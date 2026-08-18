import React from "react";
import "./styles.css";

function LandingSectionLayout({
  children,
  title,
  styles,
  titleStyles,
  id,
}: {
  children: React.ReactNode;
  title?: string;
  styles?: any;
  titleStyles?: any;
  id?: string;
}) {
  return (
    <div className="landingSectionLayoutContainer" style={styles} id={id}>
      <div className="container">
        <div className="col-md-10 mx-auto">
          <div className="landingSectionLayoutTitle" style={titleStyles}>
            <div className="col-md-6">
              <h1 className="textSecondFontBold">{title}</h1>
            </div>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default LandingSectionLayout;
