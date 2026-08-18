type DocumentItem = {
  fieldName: string;
  documentTypes: string[];
  isRequired: boolean;
  allowedFormats: string[];
};

export default (documents: DocumentItem[]) => {
  function combineDocumentsByType(documents: DocumentItem[]): DocumentItem[] {
    const combinedMap = new Map<string, DocumentItem>();

    documents.forEach((doc) => {
      // Iterate through each document type
      doc.documentTypes.forEach((docType) => {
        const normalizedType = docType.toLowerCase().replace(/\s+/g, "");

        if (combinedMap.has(normalizedType)) {
          const existingDoc = combinedMap.get(normalizedType)!;

          // Merge allowed formats without duplicates
          existingDoc.allowedFormats = Array.from(
            new Set([...existingDoc.allowedFormats, ...doc.allowedFormats])
          );

          // Ensure isRequired is true if any of the documents require it
          existingDoc.isRequired = existingDoc.isRequired || doc.isRequired;
        } else {
          // Create a new entry in the map
          const newEntry = { ...doc };
          // Combine field names if it's related to first name or last name
          if (docType === "Document name") {
            newEntry.documentTypes = [
              `${docType} ${newEntry.fieldName} lastName`,
            ];
          } else {
            newEntry.documentTypes = [...doc.documentTypes];
          }
          combinedMap.set(normalizedType, newEntry);
        }
      });
    });

    // Convert the map back to an array
    return Array.from(combinedMap.values());
  }

  const result = combineDocumentsByType(documents);

  return result;
};
