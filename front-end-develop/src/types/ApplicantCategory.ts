export type ApplicantCategoryType = {
  name?: string;
  value: string;
  _id?: string;
  nameEnglish: string;
  nameKinyarwanda: string;
  nameFrench: string;
  status: string;
  categoryName?: {
    en: string;
    fr: string;
    rw: string;
  };
  type?: string;
  maxAge: string;
  minAge: string;
};

export type GETParameters = {
  offset: number;
  limit: number;
  status?: string;
};
