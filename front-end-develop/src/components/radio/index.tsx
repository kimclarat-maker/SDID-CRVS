import { RadioType } from "@/types/Radio";
import { Radio as LibRadio } from "rsuite";

function Radio({
  label,
  required,
  value,
  error,
  name,
  onChange,
  disabled,
  checked,
}: RadioType) {
  return (
    <div>
      <label style={{ gap: 8, display: "flex", cursor: "pointer" }}>
        <LibRadio
          value={value}
          checked={checked}
          name={name}
          onChange={onChange}
          disabled={disabled}
          style={{ fontWeight: "normal" }}
        >
          {label} {required && <span className="textDanger">*</span>}
        </LibRadio>
      </label>
      {error && (
        <div className="errorContainer">
          <span className="textDanger">{error}</span>
        </div>
      )}
    </div>
  );
}

export default Radio;
