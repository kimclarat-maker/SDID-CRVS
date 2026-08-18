export type CheckboxType = {
  label?: string;
  required?: boolean;
  onChange?: (value: any, other?: any) => void;
  checked?: boolean | undefined | null;
  error?: string;
  name?: string;
  value?: string | number;
  disabled?: boolean;
  checkboxPosition?: string;
  description?: string;
  testId?: string;
  labelClassName?: string;
};
