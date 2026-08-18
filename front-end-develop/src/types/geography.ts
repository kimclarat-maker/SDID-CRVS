export type CountryTypes = {
  _id?: string;
  countryName: string;
  status: string;
  name?: string;
  offset?: number;
  limit?: number;
  code?: string;
  countryCode?: string;
};

export type CountryGETParameters = {
  offset?: number;
  limit?: number;
  countryName?: string;
  name?: string;
  status?: string;
  search?: string;
  code?: string;
};

export type ProvinceTypes = {
  _id?: string;
  provinceName?: string;
  name?: string;
  status: string;
  countryId?: any;
  countryCode?: string;
  code?: string;
};

export type ProvinceGETParameters = {
  offset?: number;
  limit?: number;
  countryName?: string;
  name?: string;
  status?: string;
  search?: string;
  provinceId?: string;
  country?: string;
  countryId?: string;
  code?: string;
};

export type DistrictTypes = {
  _id?: string;
  districtName?: string;
  name?: string;
  status: string;
  provinceId?: any;
  countryCode?: string;
  provinceCode?: string;
  code: string;
  provinceDetail?: any;
  countryDetail?: any;
  countryId?: any;
};

export type DistrictGETParameters = {
  offset?: number;
  limit?: number;
  districtName?: string;
  name?: string;
  status?: string;
  search?: string;
  country?: string;
  provinceId?: string;
};

export type SectorTypes = {
  _id?: string;
  name: string;
  provinceId?: any;
  districtId?: any;
  countryCode?: string;
  provinceCode?: string;
  districtCode?: string;
  status: string;
  code: string;
  countryId?: any;
  countryDetail?: any;
  provinceDetail?: any;
  districtDetail?: any;
};

export type SectorGETParameters = {
  offset?: number;
  limit?: number;
  sectorName?: string;
  name?: string;
  status?: string;
  search?: string;
  country?: string;
  province?: string;
  districtId?: string;
  code?: string;
};

export type CellTypes = {
  _id?: string;
  name: string;
  status: string;
  provinceId: any;
  districtId: any;
  sectorId: any;
  code: string;
  countryCode?: string;
  provinceCode?: string;
  districtCode?: string;
  sectorCode?: string;
  provinceDetail?: any;
  districtDetail?: any;
  sectorDetail?: any;
  cellDetail?: any;
  countryDetail?: any;
  countryId?: any;
};

export type CellGETParameters = {
  offset: number;
  limit: number;
  cellName?: string;
  status?: string;
  search?: string;
  country?: string;
  province?: string;
  district?: string;
  sector?: string;
  code?: string;
};

export type VillageTypes = {
  _id?: string;
  name: string;
  provinceId?: any;
  districtId?: any;
  sectorId?: any;
  cellId?: any;
  cellCode?: string;
  status: string;
  code: "";
  countryCode?: string;
  provinceCode?: string;
  districtCode?: string;
  sectorCode?: string;
  provinceDetail?: any;
  districtDetail?: any;
  sectorDetail?: any;
  cellDetail?: any;
  countryDetail?: any;
  countryId?: any;
};

export type VillageGETParameters = {
  offset: number;
  limit: number;
  villageName?: string;
  status?: string;
  search?: string;
  country?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  code?: string;
};

export type AddressTypes = {
  _id?: string;
  countryId: string;
  status: string;
  address?: string;
};

export type AddressGETParameters = {
  offset: number;
  limit: number;
  name?: string;
  status?: string;
  search?: string;
  countryId?: string;
};

export type NLAParameters = {
  requestId: string;
};

export type LoginAddress = {
  province: any;
  district: any;
  sector: any;
  cell: any;
  village: any;
};
