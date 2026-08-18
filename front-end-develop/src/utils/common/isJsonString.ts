export default (str: string) => {
  try {
    if (typeof str !== "string") return;
    if (Number(str)) return;

    JSON.parse(str);

    return true;
  } catch (e) {
    return false;
  }
};
