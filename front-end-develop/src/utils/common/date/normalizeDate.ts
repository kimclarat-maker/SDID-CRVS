export default (date: string) => {
  if (date?.includes("/")) {
    // Parse DD/MM/YYYY format
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
  } else if (date?.includes("-")) {
    // Assume it's already in YYYY-MM-DD format
    return date;
  }
  // throw new Error("Invalid date format"); // Handle unexpected format
};
