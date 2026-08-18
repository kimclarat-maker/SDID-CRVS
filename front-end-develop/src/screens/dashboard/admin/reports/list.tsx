import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { get } from "lodash";
import { onSort } from "@/utils/common/sort";
import { ReportType } from "@/types/Report";
import DownloadCell from "@/components/table/download/csv";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: ReportType[];
  totalPages: number;
  loading: boolean;
  fetchData: (params: any) => void;
  filters?: any;
  setFilters: (filters: any) => void;
  type?: string;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, loading, totalPages, setFilters, type }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof ReportType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      offset: 0,
      limit: dataKey,
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      offset: dataKey,
      limit: 10,
    }));
  };

  return (
    <>
      <Table
        data={onSort({
          data,
          sortColumn,
          sortType,
        })}
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
        totalPages={totalPages}
      >
        <Column fullText flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.province}</HeaderCell>
          <CompactCell dataKey="province" />
        </Column>

        {(type === "district" ||
          type === "sector" ||
          type === "cell" ||
          type === "village") && (
          <Column fullText flexGrow={1} resizable minWidth={150}>
            <HeaderCell className="textBold">{translation.district}</HeaderCell>
            <CompactCell dataKey="district" />
          </Column>
        )}

        {(type === "sector" || type === "cell" || type === "village") && (
          <Column fullText flexGrow={1} resizable minWidth={150}>
            <HeaderCell className="textBold">{translation.sector}</HeaderCell>
            <CompactCell dataKey="sector" />
          </Column>
        )}

        {(type === "cell" || type === "village") && (
          <Column fullText flexGrow={1} resizable minWidth={150}>
            <HeaderCell className="textBold">{translation.cell}</HeaderCell>
            <CompactCell dataKey="cell" />
          </Column>
        )}

        {type === "village" && (
          <Column fullText flexGrow={1} resizable minWidth={150}>
            <HeaderCell className="textBold">{translation.village}</HeaderCell>
            <CompactCell dataKey="village" />
          </Column>
        )}

        <Column flexGrow={1} fullText minWidth={100}>
          <HeaderCell className="textBold">{translation.pending}</HeaderCell>
          <CompactCell dataKey="pending" />
        </Column>

        <Column flexGrow={1} fullText resizable minWidth={100}>
          <HeaderCell className="textBold">{translation.approved}</HeaderCell>
          <CompactCell dataKey="completed" />
        </Column>

        <Column flexGrow={1} fullText minWidth={100}>
          <HeaderCell className="textBold">{translation.roll_backs}</HeaderCell>
          <CompactCell dataKey="rollBack" />
        </Column>

        <Column flexGrow={1} fullText resizable minWidth={100}>
          <HeaderCell className="textBold">{translation.rejected}</HeaderCell>
          <CompactCell dataKey="rejected" />
        </Column>

        <Column flexGrow={1} minWidth={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <DownloadCell fileName={`${type}-report`} type={type} page="report" />
        </Column>
      </Table>
    </>
  );
}

export default List;
