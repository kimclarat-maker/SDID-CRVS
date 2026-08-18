import Input from "@/components/input";
import { isNumberInput } from "@/utils/common/validateInput";

interface FilterInputProps {
  name: string;
  label: string;
  placeholder: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  testId: string;
  type?: "text" | "number" | "async" | "datetime-local";
  maxLength?: number;
  preventNumbers?: boolean;
  searchTextUpperCase?: boolean;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  testId,
  type = "text",
  maxLength,
  preventNumbers = false,
  searchTextUpperCase,
}) => {
  return (
    <div className="col-md-3">
      <Input
        name={name}
        label={label}
        placeholder={placeholder}
        required
        value={searchTextUpperCase ? value?.toUpperCase() : value}
        onChange={onChange}
        error={error}
        testId={testId}
        type={type}
        maxLength={maxLength}
        // containerStyles={containerStyles}
        onKeyDown={
          preventNumbers
            ? (event: any) => {
                if (isNumberInput(event)) {
                  event.preventDefault();
                }
              }
            : undefined
        }
      />
    </div>
  );
};
