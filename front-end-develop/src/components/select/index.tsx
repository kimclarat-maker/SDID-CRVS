import "@/common/styles/global.css";
import Icon from "../icon";
import { useContext } from "react";
import { SelectType } from "@/types/Select";
import AsyncSelect from "react-select/async";
import {
  CheckPicker,
  IconButton,
  InputPicker,
  SelectPicker,
  Text,
  Tooltip,
  Whisper
} from "rsuite";
import { LanguageContext } from "@/context/LanguageContext";
import Loading from "../loader";
import Empty from "../empty";
import Select from "react-select";
import Creatable from "react-select/creatable";
import { showDescriptionOnInput } from "@/utils/common/description-input";

function SelectDropdown({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  name,
  leftIcon,
  options,
  searchable,
  helperContent,
  onSearch,
  loading,
  testId,
  valueKey,
  onSelect,
  renderMenu,
  labelKey,
  onOpen,
  onClose,
  open,
  leftImage,
  type,
  containerStyles,
  inputStyles,
  labelRightContent,
  isCreatable,
  isMulti,
  countable,
  reactSelect,
  disabled,
  helperText,
  renderMenuItem,
  defaultValue,
  withTooltipLabel,
  tooltipMessage,
  appearance,
  rightContent,
  loadOptions,
  defaultOptions
}: SelectType) {
  const { translation } = useContext(LanguageContext);

  if (!testId) {
    testId = label;
  }

  const handleMenuRender = (menu: any) => {
    if (loading) {
      return (
        <center>
          <Loading />
        </center>
      );
    }
    if (options?.length === 0) {
      return <Empty title={translation.no_data} />;
    }
    return renderMenu
      ? options?.map((el: any, i: number) => (
          <div
            key={el[valueKey || "value"]}
            onClick={() => onSelect && onSelect(el[valueKey || "value"], el)}
            style={{ cursor: "pointer" }}
            data-testid={el[valueKey || "value" + i]}
          >
            {renderMenu(el)}
          </div>
        ))
      : menu;
  };

  const handleSelectChange = (value: any) => {
    if (isMulti) {
      const selectedOptions = options.filter((option: any) =>
        value.includes(option[valueKey || "value"])
      );
      onChange(selectedOptions);
    } else {
      const selectedOption = options.find(
        (option: any) => option[valueKey || "value"] === value
      );
      if (selectedOption) {
        const result = {
          ...selectedOption,
          label: selectedOption[labelKey || "label"],
          value: selectedOption[valueKey || "value"]
        };
        onChange(result);
      }
    }
  };

  // Function to handle clearing the value
  const handleClear = () => {
    onChange(null); // Clears the selected value
  };

  let props: any = {
    data: options,
    name: name,
    placeholder: placeholder || translation.select,
    value: value,
    onChange,
    block: true,
    labelKey: labelKey || "label",
    valueKey: valueKey || "value",
    searchable: searchable,
    onSearch: onSearch,
    onSelect: onSelect,
    "data-testid": testId,
    renderMenu: handleMenuRender,
    onOpen: onOpen,
    onClose: onClose,
    open: open,
    cleanable: true, // Ensures the clean button appears
    onClean: handleClear, // Set the clear function
    isMulti,
    isCreatable,
    countable,
    disabled,
    renderMenuItem,
    isLoading: loading
  };

  if (reactSelect) {
    props.isDisabled = disabled;
    props.isLoading = loading;
    props.isCreatable = isCreatable;
  }

  const rSelect = {
    menuPortalTarget: document.body,
    styles: {
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    }
  };

  return (
    <div className="input-container" style={containerStyles}>
      <div className="d-flex align-items-center">
        {label && (
          <label
            className="inputLabel textBold d-flex align-items-center"
            style={{ flex: 1 }}
          >
            <div>
              {label} {required && <span className="textDanger">*</span>}
            </div>

            {showDescriptionOnInput(translation, name) && (
              <Whisper
                placement="top"
                trigger="hover"
                speaker={
                  <Tooltip>{showDescriptionOnInput(translation, name)}</Tooltip>
                }
              >
                <IconButton
                  size="xs"
                  icon={<Icon name="info" styles={{ fontSize: 14 }} />}
                  appearance="subtle"
                />
              </Whisper>
            )}
          </label>
        )}
        {labelRightContent && labelRightContent}
      </div>
      <div
        className={`input ${appearance} ${error ? "errored" : ""} ${
          disabled ? "disabled" : ""
        }`}
        style={inputStyles || {}}
      >
        {leftIcon && (
          <div className="inputLeftContainer">
            <Icon name={leftIcon} />
          </div>
        )}
        {leftImage && (
          <div className="inputLeftContainer">
            <div>
              <img src={leftImage} />
            </div>
          </div>
        )}
        <div style={{ flex: 1, paddingLeft: leftIcon ? "0.6rem" : 0 }}>
          {isCreatable ? (
            <Creatable {...props} options={options} isClearable />
          ) : reactSelect ? (
            <Select
              {...props}
              options={options}
              menuPortalTarget={document.body} // Render the dropdown outside the panel
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }) // Ensure proper layering
              }}
              isClearable
              menuShouldScrollIntoView={false}
            />
          ) : isMulti ? (
            <CheckPicker
              sticky
              {...props}
              data={options}
              cleanable
              onChange={handleSelectChange}
              value={value.map((el: any) => el.value)}
              countable={countable}
            />
          ) : type === "object" ? (
            // <SelectPicker
            //   {...props}
            //   data={options}
            //   {...rSelect}
            //   onChange={(e) => handleSelectChange(e)}
            //   value={value?.value}
            //   onClean={handleClear} // Ensure this works for clearing
            //   defaultValue={defaultValue}
            // />

            <Select
              {...props}
              options={options}
              menuPortalTarget={document.body} // Render the dropdown outside the panel
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }) // Ensure proper layering
              }}
              isClearable
              menuShouldScrollIntoView={false}
              isLoading={loading}
            />
          ) : type === "async" ? (
            <AsyncSelect
              {...props}
              defaultOptions={defaultOptions}
              loadOptions={loadOptions}
              menuPortalTarget={document.body} // Render the dropdown outside the panel
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }) // Ensure proper layering
              }}
              isClearable
              menuShouldScrollIntoView={false}
              isLoading={loading}
            />
          ) : type === "rsuite" ? (
            <InputPicker {...props} />
          ) : (
            <Select
              {...props}
              options={options}
              menuPortalTarget={document.body} // Render the dropdown outside the panel
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 1050 }) // Ensure proper layering
              }}
              isClearable
              menuShouldScrollIntoView={false}
            />
            // <InputPicker {...props} />
          )}
        </div>
        <div className="inputRightContainer">
          {rightContent && <div>{rightContent}</div>}
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
          <Icon name="error" styles={{ fontSize: 14 }} />
          <span className="textDanger">{error}</span>
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;
