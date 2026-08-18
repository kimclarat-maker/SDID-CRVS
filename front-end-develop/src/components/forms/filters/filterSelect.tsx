import SelectDropdown from "@/components/select";

interface FilterSelectProps {
  name: string;
  label: string;
  placeholder: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  testId: string;
  options: any[];
  loading?: boolean;
  type?: "string" | "object";
  containerStyles?: React.CSSProperties;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  testId,
  options,
  loading = false,
  type = "string",
  containerStyles = { marginBottom: 0 },
}) => {
  return (
    <div className="col-md-3">
      <SelectDropdown
        name={name}
        label={label}
        placeholder={placeholder}
        required
        value={value}
        onChange={onChange}
        error={error}
        testId={testId}
        options={options}
        loading={loading}
        type={type}
        // containerStyles={containerStyles}
      />
    </div>
  );
};
