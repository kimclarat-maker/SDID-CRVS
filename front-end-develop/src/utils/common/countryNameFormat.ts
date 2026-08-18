import { countries } from "@/constants/countries";
import { nationalities } from "@/constants/nationality";

export const formateNationality: any = (txt: string) => {
  const n = nationalities.find((el: any) => el?.value === txt);

  if (n) {
    return n?.label || "";
  }

  return txt;
};

export const convertCountryCodeToName = (txt: string) => {
  if (!txt || txt === "") return "";
  if (txt?.length > 3) return txt;

  let name = "";

  for (let el of countries) {
    if (el?.countryCode?.toUpperCase() === txt?.toUpperCase()) {
      name = el.label;
      break;
    }
  }

  return name;
};
