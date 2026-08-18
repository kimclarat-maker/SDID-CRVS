import rwandaLocations from "@/constants/local-locations.json";

// Define the type of the location entries
type RwandaLocation = {
  Provincename: string;
  DistrictName: string;
  SectorName: string;
  CellName: string;
  VillageName: string;
};

const rwandaLocationsArray: RwandaLocation[] =
  rwandaLocations as RwandaLocation[];

// Mapping of alternative labels to the canonical label
export const provinceMappings: { [key: string]: string } = {
  Kigali: "Umujyi wa Kigali",
  "Kigali City": "Umujyi wa Kigali",
  "Kigali Town": "Umujyi wa Kigali",
  // Add more mappings as needed
};

export const listProvinces = () => {
  // List of provinces with canonical labels
  const provinces = [
    {
      label: "Umujyi wa Kigali",
      value: "Umujyi wa Kigali",
    },
    {
      label: "Amajyepfo",
      value: "Amajyepfo",
    },
    {
      label: "Iburengerazuba",
      value: "Iburengerazuba",
    },
    {
      label: "Amajyaruguru",
      value: "Amajyaruguru",
    },
    {
      label: "Iburasirazuba",
      value: "Iburasirazuba",
    },
  ];

  // Function to get the canonical label for a given input
  const getCanonicalLabel = (input: string) => {
    return provinceMappings[input] || input;
  };

  // Return provinces with canonical labels
  return provinces.map((province) => ({
    ...province,
    label: getCanonicalLabel(province.label),
  }));
};
export const listDistricts = (province?: string) => {
  try {
    if (!province) return [];

    let districts = [];

    let unique: any = [];

    for (let el of rwandaLocationsArray) {
      if (!unique.includes(el.DistrictName) && el.Provincename === province) {
        districts.push({
          label: el.DistrictName,
          value: el.DistrictName,
        });

        unique.push(el.DistrictName);
      }
    }

    return districts;
  } catch (error) {
    return [];
  }
};

export const listSectors = (province?: string, district?: string) => {
  try {
    if (!province) return [];
    if (!district) return [];

    let sectors = [];

    let unique: any = [];

    for (let el of rwandaLocationsArray) {
      if (!unique.includes(el.SectorName) && el.DistrictName === district) {
        sectors.push({
          label: el.SectorName,
          value: el.SectorName,
        });

        unique.push(el.SectorName);
      }
    }

    return sectors;
  } catch (error) {
    return [];
  }
};

export const listCells = (
  province?: string,
  district?: string,
  sector?: string
) => {
  try {
    if (!province) return [];
    if (!district) return [];
    if (!sector) return [];

    let cells = [];

    let unique: any = [];

    for (let el of rwandaLocationsArray) {
      if (!unique.includes(el.CellName) && el.SectorName === sector) {
        cells.push({
          label: el.CellName,
          value: el.CellName,
        });

        unique.push(el.CellName);
      }
    }

    return cells;
  } catch (error) {
    return [];
  }
};

export const listVillages = (
  province?: string,
  district?: string,
  sector?: string,
  cell?: string
) => {
  try {
    if (!province) return [];
    if (!district) return [];
    if (!sector) return [];
    if (!cell) return [];

    let villages = [];

    let unique: any = [];

    for (let el of rwandaLocationsArray) {
      if (
        !unique.includes(el.VillageName) &&
        el.CellName === cell &&
        el.VillageName !== "SANS_VILLAGE"
      ) {
        villages.push({
          label: el.VillageName,
          value: el.VillageName,
        });

        unique.push(el.VillageName);
      }
    }
    return villages;
  } catch (error) {
    return [];
  }
};
