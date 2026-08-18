import {
  fetchDocumentTypes,
  fetchSingleDocumentType,
} from "@/api/document-types";
import { LanguageContext } from "@/context/LanguageContext";
import { DocumentType, GETParameters } from "@/types/DocumentType";
import { useCallback, useContext, useMemo, useState } from "react";

export const useFetchDocumentTypes = (type?: string) => {
  const [loadingDocumentTypes, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const { translation } = useContext(LanguageContext);

  const fetchDocumentTypesData = useCallback(async (params: GETParameters) => {
    setLoading(true);

    try {
      const data = await fetchDocumentTypes(params);
      if (data && data.data) {
        if (type === "dropdown") {
          const formatData = data.data.data.map((el: any) => {
            return {
              ...el,
              value: el._id,
              label: el.name,
              type: el.value,
            };
          });

          setDocumentTypes(formatData);
          setLoading(false);

          return;
        }
        setDocumentTypes(data.data.data);

        setTotalPages(data.data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch document types:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use useMemo to format the questions only when the questions or translation change
  const formattedData = useMemo(() => {
    return documentTypes
      .map((el: any) => {
        if (!el.identifierName) return null;
        return {
          ...el,
          label:
            translation.default === "english"
              ? el.identifierName.en
              : translation.default === "french"
              ? el.identifierName.fr
              : translation.default === "kinyarwanda"
              ? el.identifierName.rw
              : el.name,
        };
      })
      .filter(Boolean); // Filter out any null values
  }, [documentTypes, translation]);

  return {
    loadingDocumentTypes,
    documentTypes: formattedData,
    fetchDocumentTypesData,
    setLoading,
    totalPages,
  };
};

export const useFetchSingleDocumentType = () => {
  const [loadingDocumentType, setLoading] = useState(false);
  const [documentTypeInfo, setDocumentTypes] = useState<DocumentType>();

  const fetchSingleDocumentTypeData = async (id: string) => {
    setLoading(true);

    try {
      const data = await fetchSingleDocumentType(id);
      if (data && data.data) {
        setDocumentTypes(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch single document type:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loadingDocumentType,
    documentTypeInfo,
    fetchSingleDocumentTypeData,
    setLoading,
  };
};
