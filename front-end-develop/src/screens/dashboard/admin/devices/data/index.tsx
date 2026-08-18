import AppFilters from "../filters";
import List from "../list";
import { useContext, useEffect, useRef, useState } from "react";
import AddDevices from "../add";
import { useFetchDevices } from "@/hooks/useDevices";
import Modal from "@/components/Modal";
import { LanguageContext } from "@/context/LanguageContext";
import { ButtonToolbar, Heading, Stack, Table } from "rsuite";
import Button from "@/components/button";
import { defineAccess } from "@/utils/common/permissions";
import Papa from "papaparse";
import toastMessage from "@/utils/common/toastMessage";
import api from "@/api";
import { getStorage } from "@/utils/storage";

function Devices() {
  const [filters, setFilters] = useState();
  const { translation } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvModal, setCsvModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data, loading, fetchDeviceData, totalPages } = useFetchDevices();
  const [isUploading, setUploading] = useState(false);

  const fetchData = (params: any = {}) => {
    fetchDeviceData({
      serialNumber: params?.serialNumber,
      deviceType: params?.deviceType?.value || params?.deviceType,
      status: params?.status?.value || params?.status,
      assignmentStatus:
        params?.assignmentStatus?.value || params?.assignmentStatus,
      accountId:
        params?.account && params?.account !== ""
          ? params?.accountId?.value || params?.accountId
          : undefined,
      offset: params.offset || 0,
      limit: params.limit || 10,
      search: params.search && params.search !== "" ? params.search : undefined,
    });
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toastMessage("error", translation.invalid_csv_file);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          toastMessage("error", translation.csv_file_empty);
          return;
        }
        setCsvData(results.data);
        setCsvModal(true);
      },
      error: (err) =>
        toastMessage("error", `Failed to parse CSV: ${err.message}`),
    });

    // reset input value to allow re-upload of the same file
    e.target.value = "";
  };

  const handleCsvSubmit = async () => {
    const batchSize = 100;

    const userLoggedIn = await getStorage();

    setUploading(true);

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);

      for (const row of batch) {
        if (!row["Name"] || !row["Serial Number"] || !row["Model"]) {
          continue; // skip invalid rows
        }

        const body = {
          name: row["Name"],
          serialNumber: row["Serial Number"],
          model: row["Model"],
          item: row["Name"],
          status: row["Status"]?.toUpperCase(),
          deviceType: row["Device Type"]?.toUpperCase(),
          condition: row["Condition"]?.toUpperCase(),
          centerId: userLoggedIn?.account?.centerId,
        };

        const options = {
          method: "POST",
          url: "/devices/register",
          data: body,
        };

        try {
          await api(options);
        } catch (rowError) {
          console.error(
            `Failed to upload row ${row["Serial Number"]}:`,
            rowError
          );
          // optionally show a toast for this row
          toastMessage("error", rowError);
        }

        // small delay to avoid overwhelming backend
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    toastMessage("success", translation.csv_upload_success);

    // After submission, refresh device list
    fetchData(filters);
    setCsvModal(false);
    setCsvData([]);
    setUploading(false);
  };

  return (
    <>
      <Stack>
        <Stack.Item grow={1}>
          <Heading level={4}>{translation.devices}</Heading>
        </Stack.Item>
        <Stack.Item>
          <ButtonToolbar>
            {defineAccess({ method: "post", module: "deviceManagement" }) && (
              <>
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                  <Button
                    text={translation.import}
                    startIcon="attach_file"
                    appearance="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  />
                </label>
                <Button
                  text={translation.add}
                  startIcon="add"
                  onClick={() => setOpen(true)}
                />
              </>
            )}
          </ButtonToolbar>
        </Stack.Item>
      </Stack>
      <br />

      <AppFilters setFilters={setFilters} filters={filters} />
      <br />

      <List
        data={data}
        loading={loading}
        fetchData={fetchData}
        totalPages={totalPages}
        setFilters={setFilters}
      />

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.devices}
      >
        <AddDevices handleClose={() => setOpen(false)} fetchData={fetchData} />
      </Modal>

      <Modal
        show={csvModal}
        handleClose={() => setCsvModal(false)}
        title={translation.preview}
      >
        <div className="rs-modal-body">
          <div style={{ maxHeight: "50vh", overflow: "auto" }}>
            <Table
              height={300}
              data={csvData}
              autoHeight
              bordered
              style={{ minWidth: 800 }}
            >
              {Object.keys(csvData[0] || {}).map((key) => (
                <Table.Column
                  key={key}
                  fullText
                  sortable
                  flexGrow={1}
                  resizable
                  minWidth={150}
                >
                  <Table.HeaderCell>{key}</Table.HeaderCell>
                  <Table.Cell dataKey={key} />
                </Table.Column>
              ))}
            </Table>
          </div>
          <Stack spacing={16} style={{ marginTop: 10 }}>
            <Button
              text={translation.cancel}
              appearance="ghost"
              onClick={() => setCsvModal(false)}
            />
            <Button
              text={translation.submit}
              onClick={handleCsvSubmit}
              loading={isUploading}
            />
          </Stack>
        </div>
        <br />
      </Modal>
    </>
  );
}

export default Devices;
