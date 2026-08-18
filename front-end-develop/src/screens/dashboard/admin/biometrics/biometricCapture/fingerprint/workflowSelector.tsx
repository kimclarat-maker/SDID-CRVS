// workflowSelector.tsx
import { useEffect, useState } from "react";
import SelectDropdown from "@/components/select";

interface XmlFile {
  label: string;
  value: string;
}

interface XmlFileSelectorProps {
  onFileSelect: (content: string) => void;
  defaultWorkflow?: string;
  disabled: boolean;
}

const XmlFileSelector = ({
  onFileSelect,
  defaultWorkflow = "LTR-442.xml",
  disabled,
}: XmlFileSelectorProps) => {
  const [xmlFiles, setXmlFiles] = useState<XmlFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>(defaultWorkflow);

  useEffect(() => {
    const loadXmlFiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/xml_files_list.json");
        if (!response.ok) throw new Error("Failed to fetch file list");

        const files = await response.json();
        const formattedFiles = files.map((file: string) => ({
          label: file.replace(".xml", ""),
          value: file,
        }));

        setXmlFiles(formattedFiles);

        // Check if default exists in the list
        const defaultExists = formattedFiles.some(
          (f: XmlFile) => f.value === defaultWorkflow
        );
        const fileToLoad = defaultExists
          ? defaultWorkflow
          : formattedFiles[0]?.value;

        if (fileToLoad) {
          setSelectedFile(fileToLoad);
          await loadXmlContent(fileToLoad);
        }
      } catch (error) {
        console.error("Error loading XML files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadXmlFiles();
  }, [defaultWorkflow]);

  const loadXmlContent = async (filename: string) => {
    try {
      const response = await fetch(`/workflows/${filename}`);
      const content = await response.text();
      onFileSelect(content);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
    }
  };

  const handleSelect = async (value: string) => {
    setSelectedFile(value);
    await loadXmlContent(value);
  };

  return (
    <SelectDropdown
      name="xmlFile"
      options={xmlFiles}
      label="Select Workflow Template"
      placeholder="Select workflow"
      loading={isLoading}
      value={selectedFile}
      onChange={handleSelect}
      renderMenuItem={(label: string, item: any) => (
        <div>
          <span
            style={{
              fontWeight: item.value === defaultWorkflow ? "bold" : "normal",
              color:
                item.value === defaultWorkflow
                  ? "var(--color-primary-600)"
                  : "inherit",
            }}
          >
            {label}
            {item.value === defaultWorkflow && " (Default)"}
          </span>
        </div>
      )}
      disabled={disabled}
    />
  );
};

export default XmlFileSelector;
