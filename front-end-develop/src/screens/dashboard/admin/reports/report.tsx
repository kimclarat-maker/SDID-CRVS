import List from "./list";
import { useContext, useEffect, useRef, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { CSVLink } from "react-csv";
import { useFetchReport } from "@/hooks/useReport";
import Filters from "./filters";
import moment from "moment";
import { ButtonToolbar } from "rsuite";
import Button from "@/components/button";

const DEFAULT_FILTERS = {
  startDate: moment()
    .startOf("d")
    .subtract(4, "days")
    .format("YYYY-MM-DD HH:mm"),
  endDate: moment().endOf("d").format("YYYY-MM-DD HH:mm"),
};

function Reports({ tab }: { tab: string }) {
  const csvRef = useRef<any>(null);
  const { translation } = useContext(LanguageContext);

  const [type, setType] = useState("province");

  const [filters, setFilters] = useState<any>({
    ...DEFAULT_FILTERS,
  });
  const { data, loading, fetchReportData, totalPages } = useFetchReport();

  const fetchData = (filters: any) => {
    let type =
      filters?.province && filters?.district && filters?.sector && filters?.cell
        ? "village"
        : filters?.province && filters?.district && filters?.sector
        ? "cell"
        : filters?.province && filters?.district
        ? "sector"
        : filters?.province
        ? "province"
        : "province";

    setType(type);

    fetchReportData({
      ...filters,
      offset: 0,
      limit: 2000,
      type: type || "province",
      country: filters?.country || "RW",
      province: filters?.province,
      district: filters?.district,
      sector: filters?.sector,
      cell: filters?.cell,
      village: filters?.village,
      search:
        filters.search && filters.search !== "" ? filters.search : undefined,
      order: filters?.order || "desc",
    });
  };

  useEffect(() => {
    if (tab !== "1") return;
    fetchData(filters);
  }, [filters, tab]);

  const handleDownload = () => {
    if (csvRef.current) {
      csvRef.current.link.click(); // Programmatically trigger the CSV download
    }
  };

  const renderCSVData = () => {
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
    <div className="row">
      <div data-testid="reports-filters" className="mb-3">
        <Filters
          setFilters={setFilters}
          filters={filters}
          fields={["search", "location", "digitalAmbassadorNid", "reviewer"]}
          loading={loading}
          bottomContent={
            <ButtonToolbar style={{ marginBottom: "1rem" }}>
              <Button
                text={translation.download}
                onClick={handleDownload}
                startIcon="download"
                appearance="default"
              />
            </ButtonToolbar>
          }
        />
      </div>

      <div data-testid="reports-list">
        <List
          setFilters={setFilters}
          data={data}
          loading={loading}
          totalPages={totalPages}
          fetchData={fetchData}
          type={type}
        />
      </div>

      <CSVLink
        ref={csvRef}
        data={renderCSVData()}
        filename={`${translation.reports}-${filters.startDate || ""}${
          filters.endDate ? `-${filters.endDate}` : ""
        }.csv`}
        target="_blank"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default Reports;
