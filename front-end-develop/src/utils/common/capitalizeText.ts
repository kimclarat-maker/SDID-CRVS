export default (str: string) => {
  let text = str?.toLowerCase() || "";
  let result = (text?.charAt(0)?.toUpperCase() || "") + (text?.slice(1) || "");

  return result;
};
