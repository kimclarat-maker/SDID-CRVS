import { DemoCenter } from "../types";
import { CENTER_NAMES, REGIONS, nextId } from "./fixtures";

export const seedCenters = (): DemoCenter[] =>
  CENTER_NAMES.map((name, i) => {
    const place = REGIONS[i % REGIONS.length];
    return {
      id: nextId("CTR"),
      name,
      region: place.region,
      district: place.district,
      address: `${12 + i * 4} ${place.localArea} Road, ${place.district}`,
      phoneNumber: `+000 555 02${(10 + i).toString()}`,
      status: "active",
    };
  });
