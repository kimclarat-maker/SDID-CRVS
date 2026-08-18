import Table from "@/components/table";
import { Table as LibTable, List as LibList, Stack } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { DateCell } from "@/components/table/date";
import { RollBack } from "@/types/RollBack";
import Modal from "@/components/Modal";
import InfoCard from "@/components/profile/infoCard/infoCard";
import { Prenrollment } from "@/types/Prenrollment";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: RollBack[];
  totalPages: number;
  loading: boolean;
  setFilters: (e: any) => void;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, totalPages, loading, setFilters }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof RollBack>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [selectedData, setSelectedData] = useState<any>({});
  const [open, setOpen] = useState(false);

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    setFilters((prevFilters: any) => ({
      ...prevFilters,
      limit: dataKey,
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    setFilters((prevFilters: any) => ({
      ...prevFilters,
      offset: dataKey,
      limit: 10,
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof RollBack;
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
            sortColumn: sortColumn as keyof RollBack,
            sortType,
          })
        }
        sortColumn={sortColumn as string}
        sortType={sortType}
        loading={loading}
        totalPages={totalPages}
        page={page}
        limit={limit}
        handleChangeLimit={handleChangeLimit}
        setPage={handleChangePage}
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <CompactCell dataKey="preEnrollmentNumber" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.reason}</HeaderCell>
          <CompactCell dataKey="rollbackReason" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.status}</HeaderCell>
          <DateCell dataKey="createdAt" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            appearance="primary"
            onClick={(rowData) => {
              setSelectedData(rowData);
              setOpen(true);
            }}
          />
        </Column>
      </Table>

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={`${translation[selectedData?.status] || selectedData?.status} `}
        size="lg"
      >
        {selectedData && (
          <InfoCard {...selectedData} photoPlacement="right" size={8} show />
        )}
      </Modal>
    </>
  );
}

export default List;
