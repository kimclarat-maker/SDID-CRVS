import { ApplicantCategoryType } from "./ApplicantCategory";

export type DocumentType = {
  _id?: string;
  nameEnglish: string;
  nameKinyarwanda: string;
  nameFrench: string;
  maxLength: number | undefined;
  value: string;
  category: ApplicantCategoryType[];
  status: string;
  identifierName?: {
    en: string;
    fr: string;
    rw: string;
  };
  name?: string;
  startWith?: string;
  citizenship: string;
};

export type GETParameters = {
  offset: number;
  limit: number;
  id?: string;
  name?: string | undefined;
  search?: string;
  category?: string;
  citizenship?: string;
  status?: string;
};
