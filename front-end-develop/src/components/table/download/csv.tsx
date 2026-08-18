import { useContext, useRef } from "react";
import { CSVLink } from "react-csv";
import { IconButton, Table } from "rsuite";
import Icon from "@/components/icon";
import { LanguageContext } from "@/context/LanguageContext";

const { Cell } = Table;

interface DownloadCellProps {
  rowData?: any;
  type?: string;
  fileName: string;
  page: string;
}

const DownloadCell: React.FC<DownloadCellProps> = (props: any) => {
  const { rowData, fileName, type, page } = props;
  const csvRef = useRef<any>(null);
  const { translation } = useContext(LanguageContext);

  const handleDownload = () => {
    if (csvRef.current) {
      csvRef.current.link.click(); // Programmatically trigger the CSV download
    }
  };

  const renderCSVData = (data: any) => {
    if (type === "province") {
      return data.map((item: any) => {
        return {
          province: item.province,
          pending: item.pending,
          [translation.pending_review]: item.pendingReview,
          [translation.review_in_progress]: item.reviewInProgress,
          [translation.request_for_change_text]: item.requestForChange,
          [translation.approved]: item.approved,
          [translation.rejected]: item.rejected,
        };
      });
    }

    if (type === "district") {
      return data.map((item: any) => ({
        province: item.province,
        district: item.district,
        [translation.pending_review]: item.pendingReview,
        [translation.review_in_progress]: item.reviewInProgress,
        [translation.request_for_change_text]: item.requestForChange,
        [translation.approved]: item.approved,
        [translation.rejected]: item.rejected,
      }));
    }

    if (type === "sector") {
      return data.map((item: any) => ({
        province: item.province,
        district: item.district,
        sector: item.sector,
        [translation.pending_review]: item.pendingReview,
        [translation.review_in_progress]: item.reviewInProgress,
        [translation.request_for_change_text]: item.requestForChange,
        [translation.approved]: item.approved,
        [translation.rejected]: item.rejected,
      }));
    }

    if (type === "cell") {
      return data.map((item: any) => ({
        province: item.province,
        district: item.district,
        sector: item.sector,
        cell: item.cell,
        [translation.pending_review]: item.pendingReview,
        [translation.review_in_progress]: item.reviewInProgress,
        [translation.request_for_change_text]: item.requestForChange,
        [translation.approved]: item.approved,
        [translation.rejected]: item.rejected,
      }));
    }

    if (type === "village") {
      return data.map((item: any) => ({
        province: item.province,
        district: item.district,
        sector: item.sector,
        cell: item.cell,
        village: item.village,
        [translation.pending_review]: item.pendingReview,
        [translation.review_in_progress]: item.reviewInProgress,
        [translation.request_for_change_text]: item.requestForChange,
        [translation.approved]: item.approved,
        [translation.rejected]: item.rejected,
      }));
    }

    // Always return an array if no type matches
    return [];
  };

  return (
    <Cell {...props} style={{ paddingBottom: "1rem" }}>
      <IconButton
        icon={<Icon name="download" />}
        onClick={handleDownload}
        appearance="subtle"
      />
      <CSVLink
        ref={csvRef}
        data={rowData._id ? renderCSVData([rowData]) : []}
        filename={`${fileName}.csv`}
        target="_blank"
        style={{ display: "none" }}
      />
    </Cell>
  );
};

export default DownloadCell;
