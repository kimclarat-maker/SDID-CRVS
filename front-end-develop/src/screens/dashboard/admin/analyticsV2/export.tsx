import React, { useContext, useState } from "react";
import Card from "@/components/card";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import { ButtonToolbar } from "rsuite";
import Modal from "@/components/Modal";
import toastMessage from "@/utils/common/toastMessage";
import { downloadGraphs, exportOperatorCSV, getSummary } from "@/api/analytics";
import OperatorPerformance from "./operatorsPeformance";

interface Props {
  selectedDate: string;
  hour?: string;
  fromHour: number;
  toHour: number;
}

const ExportData: React.FC<Props> = ({ selectedDate, fromHour, toHour }) => {
  const { translation } = useContext(LanguageContext);
  const [summary, setSummary] = useState("");
  const [openSummary, setSummaryModal] = useState(false);

  const [isExporting, setExport] = useState(false);
  const [isGeneratingSummary, setGeneratingSummary] = useState(false);

  const [exportingGraphs, setExportingGraphs] = useState(false);

  const [opModal, setOPModal] = useState(false);

  const handlingExportData = async () => {
    try {
      setExport(true);
      await exportOperatorCSV(selectedDate, "enrollment", fromHour, toHour);
      setExport(false);
    } catch (error) {
      setExport(false);

      toastMessage("error", error);
    }
  };

  const handlingViewSummary = async () => {
    try {
      setSummary("");
      setGeneratingSummary(true);
      const data = await getSummary(selectedDate, fromHour, toHour);
      setSummary(data);
      setGeneratingSummary(false);
      setSummaryModal(true);
    } catch (error) {
      setGeneratingSummary(false);

      toastMessage("error", error);

      setSummaryModal(true);
    }
  };

  const handlingExportCharts = async () => {
    try {
      setExportingGraphs(true);
      await downloadGraphs(selectedDate, fromHour, toHour);
      setExportingGraphs(false);
    } catch (error) {
      setExportingGraphs(false);

      toastMessage("error", error);
    }
  };

  return (
    <>
      <Card>
        <ButtonToolbar>
          <Button
            text={translation.download_operator_performance}
            onClick={handlingExportData}
            appearance="ghost"
            loading={isExporting}
            startIcon="group"
          />
          {/* <Button
            text={translation.operators_performance}
            onClick={() => setOPModal(true)}
            appearance="ghost"
            startIcon="downhill_skiing"
          /> */}
          <Button
            text={translation.view_summary}
            onClick={handlingViewSummary}
            appearance="ghost"
            loading={isGeneratingSummary}
            startIcon="article_shortcut"
          />
          <Button
            text={translation.export_charts}
            onClick={handlingExportCharts}
            loading={exportingGraphs}
            startIcon="insert_chart"
          />
        </ButtonToolbar>
      </Card>
      <Modal
        show={openSummary}
        handleClose={() => setSummaryModal(false)}
        title="Summary"
      >
        <div className="card-body rs-modal-body">
          <pre>{summary}</pre>
        </div>
      </Modal>

      <Modal
        show={opModal}
        handleClose={() => setOPModal(false)}
        title={translation.operators_performance}
        size="lg"
      >
        <div className="card-body rs-modal-body">
          <OperatorPerformance
            fromHour={fromHour}
            toHour={toHour}
            selectedDate={selectedDate}
          />
        </div>
      </Modal>
    </>
  );
};

export default ExportData;
