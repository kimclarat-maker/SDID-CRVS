import { useContext, useState, useRef } from "react";
import Button from "../button";
import Input from "../input";
import { LanguageContext } from "@/context/LanguageContext";
import Papa from "papaparse";
import Alert from "../alert";
import { ButtonToolbar, Progress, Stack } from "rsuite";

function ImportData({
  handleClose,
  saveData,
  refreshData,
  type,
}: {
  handleClose: () => void;
  saveData: (body: any) => Promise<{ data: any }>;
  refreshData: () => void;
  type: string;
}) {
  const { translation } = useContext(LanguageContext);
  const [isSubmitting, setLoader] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const chunkSize = 10;
  const chunks = useRef<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      if (
        fileType === "application/json" ||
        fileType === "text/csv" ||
        fileType === "application/vnd.ms-excel"
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError(translation.valid_json_csv);
      }
    }
  };

  const processChunks = async (startIndex: number) => {
    try {
      setLoader(true);
      for (let i = startIndex; i < chunks.current.length; i++) {
        setCurrentChunkIndex(i);
        await Promise.all(chunks.current[i].map((el: any) => saveData(el)));
        setProgress(Math.round(((i + 1) / chunks.current.length) * 100));
      }
      setLoader(false);
      if (progress === 100) {
        handleClose();
        refreshData && refreshData();
      }
      handleClose();
      refreshData && refreshData();
    } catch (error) {
      console.error("Error processing chunk:", error);
      setError("Error processing chunk.");
      setLoader(false);
    }
  };

  const handleSubmit = async () => {
    if (error) {
      setError(translation.valid_json_csv);
      return;
    }
    if (!file) {
      setError(translation.file_required);
      return;
    }

    setLoader(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        if (event.target?.result) {
          if (file.type === "application/json") {
            try {
              const jsonData = JSON.parse(event.target.result as string);
              chunks.current = [];
              for (let i = 0; i < jsonData.length; i += chunkSize) {
                chunks.current.push(jsonData.slice(i, i + chunkSize));
              }
              await processChunks(0);
            } catch (error) {
              console.error("Error parsing JSON file:", error);
              setError("Error parsing JSON file.");
              setLoader(false);
            }
          } else {
            Papa.parse(event.target.result as string, {
              header: true,
              complete: async (results) => {
                try {
                  chunks.current = [];
                  for (let i = 0; i < results.data.length; i += chunkSize) {
                    chunks.current.push(results.data.slice(i, i + chunkSize));
                  }
                  await processChunks(0);
                } catch (error) {
                  console.error("Error processing CSV file:", error);
                  setError("Error processing CSV file.");
                  setLoader(false);
                }
              },
              error: (error: any) => {
                console.error("Error parsing CSV file:", error);
                setError("Error parsing CSV file.");
                setLoader(false);
              },
            });
          }
        }
      };
      fileReader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setError("Error reading file.");
      setLoader(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    processChunks(currentChunkIndex);
  };

  const status = progress === 100 ? "success" : error ? "fail" : "active";
  const color =
    progress === 100 ? "var(--status-success)" : "var(--color-primary-500)";

  const handleDownloadTemplate = () => {
    const templateLinks: any = {
      center:
        "https://docs.google.com/spreadsheets/d/10Sts1_IbEjYi_rglzNeJ_AMtdYc2WkHUoL4XC-BB1jU/edit?usp=sharing",
      country:
        "https://docs.google.com/spreadsheets/d/1BXbf6Q7sftyVsVjl0UBE_U--1ioDfj2Qf4j7RNm4i-E/edit?usp=sharing",
      province:
        "https://docs.google.com/spreadsheets/d/1f1wY1oJph-IHHjEO8xvU-kkIJ1KAWTOPzjNMwHKyG80/edit?usp=sharing",
      district:
        "https://docs.google.com/spreadsheets/d/1VQZCUS2ULkWhuqTqkIbANN3PeBpSS8cZ8euKRUatUis/edit?usp=sharing",
      sector:
        "https://docs.google.com/spreadsheets/d/1Lmi5ZYgpz6FlV1G0dkzQLnumfTZ8BtFp4MkAs_4-YaY/edit?usp=sharing",
      cell: "https://docs.google.com/spreadsheets/d/1gqlRmujunM3Xgvpb5kgNe4gTKgk9eChYwM_SgGSbH8g/edit?usp=sharing",
      village:
        "https://docs.google.com/spreadsheets/d/1Imm2dBYr12AGcSOBIFLjWzqK2StDRd8gFRyDa3nSDzY/edit?usp=sharing",
    };

    const templateLink = templateLinks[type];

    if (templateLink) {
      window.open(templateLink, "_blank");
    } else {
      console.error("Invalid template type or template link not found.");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3">
          <Alert message={error} />
        </div>
      )}
      <div className="mb-3">
        <input
          type="file"
          name="import"
          onChange={handleFileChange}
          accept=".json, .csv"
          // helperText="Allowed format JSON, CSV"
        />
        {progress !== 0 && (
          <div>
            <Progress.Line
              percent={progress}
              strokeColor={color}
              status={status}
            />
          </div>
        )}
      </div>
      <Stack>
        <Stack.Item>
          <Button
            text={translation.download_template}
            onClick={handleDownloadTemplate}
            appearance="ghost"
          />
        </Stack.Item>
        <Stack.Item grow={1} />
        <Stack.Item>
          <ButtonToolbar>
            {progress === 0 && (
              <Button
                text={translation.submit}
                onClick={handleSubmit}
                loading={isSubmitting}
              />
            )}
            {error && (
              <Button
                text={translation.retry}
                onClick={handleRetry}
                appearance="default"
              />
            )}
          </ButtonToolbar>
        </Stack.Item>
      </Stack>
    </div>
  );
}

export default ImportData;
