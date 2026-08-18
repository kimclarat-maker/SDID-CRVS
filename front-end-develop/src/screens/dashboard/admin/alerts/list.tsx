import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import { DateCell } from "@/components/table/date";
import { StatusCell } from "@/components/table/status";
import { AlertType } from "@/types/Alert";
import ButtonCell from "@/components/table/button/buttonCell";
import { useNavigate } from "react-router-dom";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({
  data,
  loading,
  totalPages,
  fetchData,
}: {
  data: AlertType[];
  loading: boolean;
  totalPages: number;
  fetchData: (e: any) => void;
}) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof AlertType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isOpen, openModal] = useState(false);
  const navigate = useNavigate();

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);
    fetchData({
      offset: 0,
      limit: dataKey,
    });
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    fetchData({
      offset: dataKey,
      limit: 10,
    });
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof AlertType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  return (
    <>
      <Table
        data={onSort({
          data,
          sortColumn,
          sortType,
        })}
        handleSortClick={({ sortColumn, sortType }) =>
          handleSortClick({
            sortColumn: sortColumn as keyof AlertType,
            sortType,
          })
        }
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
        totalPages={totalPages}
      >
        <Column resizable>
          <HeaderCell className="textBold" minWidth={200}>
            {translation.prenrollment_number}
          </HeaderCell>
          <CompactCell dataKey="prenrollmentNumber" />
        </Column>

        <Column flexGrow={1} fullText resizable>
          <HeaderCell className="textBold">{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.operator}</HeaderCell>
          <CompactCell dataKey="operator" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="center.name" />
        </Column>

        <Column fullText sortable resizable flexGrow={1}>
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <DateCell dataKey="date" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              navigate(`/dashboard/admin/prenrollment/profile/${rowData._id}`);
            }}
          />
        </Column>
      </Table>
    </>
  );
}

export default List;
