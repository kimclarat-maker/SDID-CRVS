import React from "react";
import Loading from "../loader";
import { CheckboxGroup as LibCheckboxGroup } from "rsuite";

type GroupProps = {
  styles?: any;
  name?: string;
  error?: string;
  value?: string[] | number[];
  onChange: (e: any) => void;
  labelStyles?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
  valueType?: string;
  children: React.ReactNode;
  inline?: boolean;
};

function CheckboxGroup({
  name,
  error,
  onChange,
  value = [],
  styles,
  labelStyles,
  loading,
  children,
  inline,
}: GroupProps) {
  return (
    <div className="input-container" style={styles}>
      {name && (
        <label
          className="textBold"
          style={{ marginBottom: "1rem", ...labelStyles }}
        >
          {name}
        </label>
      )}
      <div className="checkboxGroup">
        {loading ? (
          <Loading />
        ) : (
          <LibCheckboxGroup
            inline={inline}
            name="checkbox-group"
            onChange={(value) => onChange(value)}
            value={value}
          >
            {children}
          </LibCheckboxGroup>
        )}
      </div>
      {error && (
        <div className="errorContainer">
          <span className="textDanger">{error}</span>
        </div>
      )}
    </div>
  );
}

export default CheckboxGroup;
