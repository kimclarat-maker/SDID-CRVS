export const isNumberInput = (event: any) => {
  // Check if the key is a digit (0-9) either in the main area or on the numpad
  return (
    (event.key >= "0" && event.key <= "9") ||
    event.code?.startsWith("Digit") ||
    event.code?.startsWith("Numpad")
  );
};
