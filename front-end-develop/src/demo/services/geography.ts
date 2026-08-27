// Demo-mode backing for src/api/geography/{countries,province,district,sector,cell,village}.
// These are reference-data lookups (used constantly by address dropdowns across
// almost every enrollment/CRVS form) plus a handful of admin CRUD screens
// (dashboard/admin/geography/*/add). Rather than inventing new fixtures, each
// collection is seeded from the existing @/mocks/geo/* arrays (already
// field-complete for the real geography screens/tables) and held in a
// module-level mutable copy so the admin add/edit/delete screens work within a
// session. Per the task brief this is intentionally NOT persisted through
// updateDemoData()/localStorage — it's read-mostly reference data, and a
// reload simply restores the seeded set, which is an acceptable trade-off here.
import { demoDelay } from "../config";
import mockCountries from "@/mocks/geo/countries";
import mockProvinces from "@/mocks/geo/provinces";
import mockDistricts from "@/mocks/geo/districts";
import mockSectors from "@/mocks/geo/sectors";
import mockCells from "@/mocks/geo/cells";
import mockVillages from "@/mocks/geo/villages";

const clone = <T,>(items: T[]): T[] => items.map((item) => ({ ...item }));

let countries: any[] = clone(mockCountries);
let provinces: any[] = clone(mockProvinces);
let districts: any[] = clone(mockDistricts);
let sectors: any[] = clone(mockSectors);
let cells: any[] = clone(mockCells);
let villages: any[] = clone(mockVillages);

const genId = (prefix: string) =>
  `${prefix}-DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

type ListParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
  [key: string]: any;
};

const paginateAndSearch = (
  items: any[],
  params: ListParams | undefined,
  searchFields: string[]
) => {
  let results = items;
  if (params?.status) {
    results = results.filter((i) => i.status === params.status);
  }
  if (params?.search) {
    const term = params.search.toLowerCase();
    results = results.filter((i) =>
      searchFields.some((f) => String(i[f] || "").toLowerCase().includes(term))
    );
  }
  const total = results.length;
  const offset = params?.offset || 0;
  const limit = params?.limit || 50000;
  return { data: results.slice(offset, offset + limit), total };
};

// ---- Countries ----
export const demoFetchCountries = async (params?: ListParams) => {
  const { data, total } = paginateAndSearch(countries, params, [
    "name",
    "code",
  ]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchSingleCountry = async (id: string) =>
  demoDelay({ data: countries.find((c) => c._id === id) });
export const demoUpdateCountry = async (params: any) => {
  const idx = countries.findIndex((c) => c._id === params._id);
  if (idx >= 0) countries[idx] = { ...countries[idx], ...params };
  return demoDelay({ data: countries[idx] });
};
export const demoDeleteCountry = async (id: string) => {
  countries = countries.filter((c) => c._id !== id);
  return demoDelay({ data: { message: "Country deleted (demo)." } });
};
export const demoCreateCountry = async (params: any) => {
  const record = { _id: genId("COUNTRY"), status: "active", ...params };
  countries.push(record);
  return demoDelay({ data: record });
};

// ---- Provinces ----
export const demoFetchProvinces = async (params?: ListParams) => {
  const { data, total } = paginateAndSearch(provinces, params, [
    "name",
    "code",
  ]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchSingleProvince = async (id: string) =>
  demoDelay({ data: provinces.find((p) => p._id === id) });
export const demoUpdateProvince = async (params: any) => {
  const idx = provinces.findIndex((p) => p._id === params._id);
  if (idx >= 0) provinces[idx] = { ...provinces[idx], ...params };
  return demoDelay(provinces[idx]);
};
export const demoDeleteProvince = async (id: string) => {
  provinces = provinces.filter((p) => p._id !== id);
  return demoDelay({ data: { message: "Province deleted (demo)." } });
};
export const demoCreateProvince = async (params: any) => {
  const record = { _id: genId("PROVINCE"), status: "active", ...params };
  provinces.push(record);
  return demoDelay(record);
};

// ---- Districts ----
const filterByProvince = (items: any[], provinceId?: string) =>
  provinceId
    ? items.filter((i) => i.provinceDetail?.id === provinceId)
    : items;

export const demoFetchDistricts = async (
  params?: ListParams & { provinceId?: string }
) => {
  const scoped = filterByProvince(districts, params?.provinceId);
  const { data, total } = paginateAndSearch(scoped, params, ["name", "code"]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchDistrictsByProvince = async (
  provinceId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  const scoped = filterByProvince(districts, provinceId);
  const { data, total } = paginateAndSearch(scoped, { status, offset, limit }, [
    "name",
    "code",
  ]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchSingleDistrict = async (id: string) =>
  demoDelay({ data: districts.find((d) => d._id === id) });
export const demoUpdateDistrict = async (params: any) => {
  const idx = districts.findIndex((d) => d._id === params._id);
  if (idx >= 0) districts[idx] = { ...districts[idx], ...params };
  return demoDelay({ data: districts[idx] });
};
export const demoDeleteDistrict = async (id: string) => {
  districts = districts.filter((d) => d._id !== id);
  return demoDelay({ data: { message: "District deleted (demo)." } });
};
export const demoCreateDistrict = async (params: any) => {
  const record = { _id: genId("DISTRICT"), status: "active", ...params };
  districts.push(record);
  return demoDelay({ data: record });
};

// ---- Sectors ----
const filterByDistrict = (items: any[], districtId?: string) =>
  districtId
    ? items.filter((i) => i.districtDetail?.id === districtId)
    : items;

export const demoFetchSectors = async (
  params?: ListParams & { districtId?: string }
) => {
  const scoped = filterByDistrict(sectors, params?.districtId);
  const { data, total } = paginateAndSearch(scoped, params, ["name", "code"]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchSectorsByDistrict = async (
  districtId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  const scoped = filterByDistrict(sectors, districtId);
  const { data, total } = paginateAndSearch(scoped, { status, offset, limit }, [
    "name",
    "code",
  ]);
  // fetchSectorsByDistrict returns the unwrapped backend payload (unlike its
  // siblings), so mirror that exactly: { data, total }, not { data: {...} }.
  return demoDelay({ data, total });
};
export const demoFetchSingleSector = async (id: string) =>
  demoDelay({ data: sectors.find((s) => s._id === id) });
export const demoUpdateSector = async (params: any) => {
  const idx = sectors.findIndex((s) => s._id === params._id);
  if (idx >= 0) sectors[idx] = { ...sectors[idx], ...params };
  return demoDelay(sectors[idx]);
};
export const demoDeleteSector = async (id: string) => {
  sectors = sectors.filter((s) => s._id !== id);
  return demoDelay({ data: { message: "Sector deleted (demo)." } });
};
export const demoCreateSector = async (params: any) => {
  const record = { _id: genId("SECTOR"), status: "active", ...params };
  sectors.push(record);
  return demoDelay(record);
};

// ---- Cells ----
const filterBySector = (items: any[], sectorId?: string) =>
  sectorId ? items.filter((i) => i.sectorDetail?.id === sectorId) : items;

export const demoFetchCells = async (
  params?: ListParams & { sectorId?: string }
) => {
  const scoped = filterBySector(cells, params?.sectorId);
  const { data, total } = paginateAndSearch(scoped, params, ["name", "code"]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchCellsBySector = async (
  sectorId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  const scoped = filterBySector(cells, sectorId);
  const { data, total } = paginateAndSearch(scoped, { status, offset, limit }, [
    "name",
    "code",
  ]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchSingleCell = async (id: string) =>
  demoDelay({ data: cells.find((c) => c._id === id) });
export const demoUpdateCell = async (params: any) => {
  const idx = cells.findIndex((c) => c._id === params._id);
  if (idx >= 0) cells[idx] = { ...cells[idx], ...params };
  return demoDelay(cells[idx]);
};
export const demoDeleteCell = async (id: string) => {
  cells = cells.filter((c) => c._id !== id);
  return demoDelay({ data: { message: "Cell deleted (demo)." } });
};
export const demoCreateCell = async (params: any) => {
  const record = { _id: genId("CELL"), status: "active", ...params };
  cells.push(record);
  return demoDelay(record);
};

// ---- Villages ----
const filterByCell = (items: any[], cellId?: string) =>
  cellId ? items.filter((i) => i.cellDetail?.id === cellId) : items;

export const demoFetchVillages = async (
  params?: ListParams & { cellId?: string }
) => {
  const scoped = filterByCell(villages, params?.cellId);
  const { data, total } = paginateAndSearch(scoped, params, ["name", "code"]);
  return demoDelay({ data: { data, total }, total });
};
export const demoFetchVillagesByCell = async (
  cellId: string,
  status?: string,
  offset?: number,
  limit?: number
) => {
  const scoped = filterByCell(villages, cellId);
  const { data, total } = paginateAndSearch(scoped, { status, offset, limit }, [
    "name",
    "code",
  ]);
  return demoDelay({ data, total });
};
export const demoFetchSingleVillages = async (id: string) =>
  demoDelay({ data: villages.find((v) => v._id === id) });
export const demoUpdateVillages = async (params: any) => {
  const idx = villages.findIndex((v) => v._id === params._id);
  if (idx >= 0) villages[idx] = { ...villages[idx], ...params };
  return demoDelay(villages[idx]);
};
export const demoDeleteVillages = async (id: string) => {
  villages = villages.filter((v) => v._id !== id);
  return demoDelay({ data: { message: "Village deleted (demo)." } });
};
export const demoCreateVillages = async (params: any) => {
  const record = { _id: genId("VILLAGE"), status: "active", ...params };
  villages.push(record);
  return demoDelay(record);
};
