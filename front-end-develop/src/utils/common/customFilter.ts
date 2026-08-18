export const customFilter = (f: any) => {
  return f && Array.isArray(f) && f?.length > 0
    ? f
    : typeof f === "string"
    ? f
    : undefined;
};
