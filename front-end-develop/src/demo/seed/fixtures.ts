// Shared fictional fixtures for the demo seed generators. Names, places and
// contact details are invented and must never resemble real people or
// real government domains/numbers.

export const FIRST_NAMES = [
  "Amara",
  "Kofi",
  "Lena",
  "Tariq",
  "Noor",
  "Ines",
  "Diego",
  "Priya",
  "Owen",
  "Sofia",
  "Kwame",
  "Mira",
  "Elan",
  "Zara",
  "Marco",
  "Yuki",
  "Aiden",
  "Chidi",
  "Lucia",
  "Femi",
  "Tessa",
  "Ravi",
  "Nadia",
  "Otto",
  "Bianca",
];

export const LAST_NAMES = [
  "Bello",
  "Carter",
  "Dubois",
  "Eze",
  "Farrow",
  "Gomez",
  "Haile",
  "Ibori",
  "Jansen",
  "Kadiri",
  "Lindqvist",
  "Mensah",
  "Nakamura",
  "Okoye",
  "Pereira",
  "Quintero",
  "Reyes",
  "Santos",
  "Toure",
  "Uba",
  "Vance",
  "Weber",
  "Xu",
  "Yalcin",
  "Zeleke",
];

export const REGIONS = [
  { region: "Northern Region", district: "Cedar District", localArea: "Riverside" },
  { region: "Northern Region", district: "Cedar District", localArea: "Hillcrest" },
  { region: "Eastern Region", district: "Maple District", localArea: "Fairview" },
  { region: "Eastern Region", district: "Birch District", localArea: "Lakeview" },
  { region: "Southern Region", district: "Willow District", localArea: "Sunnyside" },
  { region: "Southern Region", district: "Willow District", localArea: "Greenfield" },
  { region: "Western Region", district: "Elm District", localArea: "Brookside" },
  { region: "Central Region", district: "Ash District", localArea: "Meadowbrook" },
];

export const CENTER_NAMES = [
  "Central Registration Centre",
  "Riverside Service Centre",
  "Hillcrest Community Office",
  "Fairview District Office",
];

let idCounter = 0;
export const nextId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${idCounter.toString().padStart(4, "0")}`;
};

export const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length];

export const demoPhoneNumber = (seed: number) =>
  `+000 555 01${(seed % 90 + 10).toString().padStart(2, "0")}`;

export const demoEmail = (first: string, last: string, seed: number) =>
  `${first.toLowerCase()}.${last.toLowerCase()}${seed}@demo.identity.local`;

export const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const isoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
