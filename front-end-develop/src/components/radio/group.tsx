import React from "react";
import Loading from "../loader";
import { RadioGroup as LibRadioGroup, Text } from "rsuite";

type GroupProps = {
  styles?: any;
  name?: string;
  error?: string;
  onChange: (e: any) => void;
  labelStyles?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
  valueType?: string;
  children: React.ReactNode;
  value?: string;
  inline?: boolean;
  required?: boolean;
  label?: string;
  defaultValue?: string;
};

function RadioGroup({
  name,
  error,
  onChange,
  styles,
  labelStyles,
  loading,
  children,
  value = "",
  inline,
  required,
  label,
  defaultValue,
}: GroupProps) {
  return (
    <div className="input-container" style={styles}>
      {name && (
        <label
          className="textBold"
          style={{ marginBottom: "1rem", ...labelStyles }}
        >
          {label || name} {required && <span style={{ color: "red" }}>*</span>}
        </label>
      )}
      <div className="checkboxGroup">
        {loading ? (
          <Loading />
        ) : (
          <LibRadioGroup
            inline={inline}
            name="radio-group-controlled"
            onChange={(value) => onChange(value)}
            value={value}
            defaultValue={defaultValue}
          >
            {children}
          </LibRadioGroup>
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

export default RadioGroup;
