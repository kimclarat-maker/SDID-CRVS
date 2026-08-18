import { DocumentType } from "./DocumentType";

export type AdultType = {
  category: any;
  documentIdentificationNumber: string;
  type: DocumentType | null;
};

export type Child = {
  parentDocumentIdNumber: string;
  certificateNumber: string;
};
