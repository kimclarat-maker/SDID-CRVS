import { CheckboxType } from "@/types/Checkbox";
import { Checkbox as LibCheckbox, Text } from "rsuite";

function Checkbox({
  label,
  required,
  value,
  error,
  name,
  onChange,
  disabled,
  description,
  checked,
  testId,
  labelClassName,
}: CheckboxType) {
  return (
    <div>
      <LibCheckbox
        value={value}
        checked={checked || false}
        name={name}
        onChange={onChange}
        disabled={disabled}
        style={{ fontWeight: "normal" }}
        data-testid={testId}
      >
        <>
          <div>
            <span>
              {label}
              {required && <span className="textDanger">*</span>}
            </span>
          </div>
          {description && <Text muted>{description}</Text>}
        </>
      </LibCheckbox>
      {error && (
        <div className="errorContainer">
          <span className="textDanger">{error}</span>
        </div>
      )}
    </div>
  );
}

export default Checkbox;
