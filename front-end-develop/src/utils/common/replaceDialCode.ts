import { countries } from "@/constants/countries";

export function replaceDialCode(phone: string) {
  const matchedCountry = countries.find((country) =>
    phone.startsWith(country.dialCode)
  );

  if (matchedCountry) {
    // Replace the matched dial code with the new dial code
    const phoneWithoutDialCode = phone.replace(matchedCountry.dialCode, "");
    console.log("====================================");
    console.log({ phoneWithoutDialCode });
    console.log("====================================");
    return phoneWithoutDialCode;
  }

  // Return original phone if no match is found
  return phone;
}
