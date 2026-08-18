export const handlePaste = (
  e: any,
  field: string,
  setFieldValue: (field: string, txt: string) => void
) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData("text");
  const textWithoutSpaces = pastedText.replace(/\s/g, "");
  setFieldValue(field, textWithoutSpaces);
};
