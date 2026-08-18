export type RadioType = {
  label?: string;
  required?: boolean;
  onChange?: (value: any) => void;
  checked?: boolean | undefined;
  error?: string;
  name: string;
  value: string | number;
  disabled?: boolean;
  checkboxPosition?: string;
};
