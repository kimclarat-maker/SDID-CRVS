export type SecurityQuestionTypes = {
  _id?: string;
  questionKinyarwanda?: string;
  questionEnglish?: string;
  questionFrench?: string;
  name?: string;
  value?: string;
  answerType?: string;
  documentType?: string[];
  status?: string;
  question?: {
    en: string;
    fr: string;
    rw: string;
  };
};

export type VerificationSecurityQuestionType = {
  preEnrollmentTempId: string;
  answers?: {
    questionId?: string;
    answer?: string;
  }[];
};

export type GETParameters = {
  search?: string;
  offset: number;
  limit: number;
  documentTypeId?: string;
  status?: string;
};
