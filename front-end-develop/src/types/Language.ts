export type LanguageType = {
  type: string;
  payload: any;
};

export type LanguageContextType = {
  translation: any;
  setLanguage: (lng: any) => void;
};
