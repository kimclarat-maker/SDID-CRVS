import { InputType } from "@/types/Input";
import "@/common/styles/global.css";
import Icon from "../icon";
import { Text, Input as LibInput } from "rsuite";
import SelectDropdown from "../select";
import { countries } from "@/constants/countries";
import { useState } from "react";
import Loading from "../loader";
import moment from "moment";

function Input({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  name,
  leftIcon,
  rightIcon,
  handleShowPassword,
  helperText,
  rightContent,
  maxLength,
  min,
  styleType,
  containerStyles,
  inputStyles,
  autoFocus,
  autoComplete,
  helperContent,
  labelRightContent,
  max,
  disabled,
  isMulti,
  testId,
  step,
  as,
  rows,
  leftText,
  className,
  inputContainerClasses,
  withCountry,
  leftImage,
  onChangeCountry,
  accept,
  loading,
  multiple,
  minLength,
  onKeyDown,
  onPaste,
}: InputType) {
  const formateCountries = countries.map((el) => {
    return {
      label: el.dialCode,
      value: el.dialCode,
      flag: el.flag,
    };
  });

  if (!testId) {
    testId = label;
  }

  const [selectedCountry, setCountry] = useState<any>(formateCountries[0]);

  const formatValue = (value: string, type: string) => {
    if (type === "date") {
      // Check if the date is valid and in the format DD/MM/YYYY
      const isValidDate = moment(value, "DD/MM/YYYY", true).isValid();
      if (isValidDate) {
        return moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");
      } else {
        return value;
      }
    } else if (type !== "file") {
      return value;
    } else {
      return undefined;
    }
  };
  const props = {
    name: name,
    type: type,
    className: `${className}`,
    placeholder: placeholder,
    value: formatValue(value, type),
    onChange: onChange,
    style: !leftIcon ? { paddingLeft: 0 } : {},
    maxLength: maxLength,
    min: min,
    autoFocus: autoFocus,
    autoComplete: autoComplete,
    max: max,
    disabled: disabled,
    onInput: (e: any) => {
      const inputElement = e.target as HTMLInputElement;
      if (maxLength && inputElement.value.length > maxLength) {
        inputElement.value = inputElement.value.slice(0, maxLength);
      }
      if (isMulti) {
        inputElement.style.height = "auto";
        inputElement.style.height = `${inputElement.scrollHeight}px`;
      }
    },
    "data-testid": testId,
    step: step,
    as,
    rows,
    accept,
    loading,
    multiple,
    minLength,
    onPaste,
  };

  return (
    <div
      className={`input-container ${inputContainerClasses}`}
      style={containerStyles}
    >
      <div className="d-flex align-items-center">
        {label && (
          <label
            className="inputLabel textBold d-flex align-items-center"
            style={{ flex: 1 }}
          >
            <div>
              {label} {required && <span className="textDanger">*</span>}
            </div>

            {/* {showDescriptionOnInput(translation, name) && (
              <Whisper
                placement="top"
                trigger="hover"
                speaker={
                  <Tooltip>{showDescriptionOnInput(translation, name)}</Tooltip>
                }
                // {<Tooltip>{tooltipMessage}</Tooltip>}
              >
                <IconButton
                  size="xs"
                  icon={<Icon name="info" styles={{ fontSize: 14 }} />}
                  appearance="subtle"
                />
              </Whisper>
            )} */}
          </label>
        )}
        {labelRightContent && labelRightContent}
      </div>

      <div
        className={`input ${styleType} ${error ? "errored" : ""} ${
          disabled ? "disabled" : ""
        }`}
        style={inputStyles}
      >
        {leftIcon && (
          <div className="inputLeftContainer">
            <Icon name={leftIcon} testId="left-icon" />
          </div>
        )}
        {leftText && (
          <div className="inputLeftContainer" style={{ marginRight: "0.5rem" }}>
            <Text weight="semibold">{leftText}</Text>
          </div>
        )}
        {leftImage && (
          <div className="inputLeftContainer">
            <div>
              <img src={leftImage} />
            </div>
          </div>
        )}
        {withCountry && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {selectedCountry && selectedCountry.flag && (
              <div className="inputLeftContainer">
                <div>
                  <img src={selectedCountry.flag} alt="Flag" />
                </div>
              </div>
            )}

            <SelectDropdown
              options={formateCountries}
              name="country"
              value={selectedCountry}
              onChange={(el) => {
                setCountry(el);
                onChangeCountry && onChangeCountry(el);
              }}
              type="object"
              inputStyles={{ borderBottom: 0, border: 0 }}
              containerStyles={{ marginBottom: 0 }}
              appearance="subtle"
            />
          </div>
        )}
        {type === "file" ? (
          <input {...props} data-testid={testId || "input"} />
        ) : isMulti ? (
          <LibInput
            htmlSize={10}
            {...props}
            as="textarea"
            onKeyDown={onKeyDown}
          />
        ) : (
          <LibInput
            {...props}
            data-testid={testId || "input"}
            onKeyDown={onKeyDown}
          />
        )}

        <div className="inputRightContainer" onClick={handleShowPassword}>
          {rightIcon && <Icon name={rightIcon} testId="right-icon" />}
          {rightContent && <div>{rightContent}</div>}
          {loading && (
            <div>
              <Loading />
            </div>
          )}
        </div>
      </div>
      {helperText && (
        <div className="inputHelperText">
          <Text muted>{helperText}</Text>
        </div>
      )}
      {helperContent && <>{helperContent}</>}
      {error && (
        <div className="errorContainer" role="alert">
          <Icon name="error" testId="error-icon" styles={{ fontSize: 14 }} />
          <Text className="textDanger">{error}</Text>
        </div>
      )}
    </div>
  );
}

export default Input;
