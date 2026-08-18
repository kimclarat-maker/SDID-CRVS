export const updateDropdownFromCurrentStepData = (
  setFieldValue: any,
  field: string,
  value: string,
  data: any = [],
  comparedField?: string
) => {
  for (let el of data) {
    if (el[comparedField || "value"] === value) {
      const result = el;

      setFieldValue(field, result);
      break;
    }
  }
};
