import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { EnrollmentType } from "@/types/Enrollment";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { ImageCell } from "@/components/table/image";
import { LinkCell } from "@/components/table/linkCell";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: EnrollmentType[];
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
  const [sortColumn, setSortColumn] = useState<keyof EnrollmentType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();

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
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof EnrollmentType;
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
            sortColumn: sortColumn as keyof EnrollmentType,
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
        <Column resizable minWidth={20}>
          <HeaderCell>{translation.photo}</HeaderCell>
          <ImageCell dataKey="selfie" name={["firstName", "lastName"]} />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <LinkCell
            dataKey="preEnrollmentNumber"
            onClick={(rowData) => {
              navigate(
                `/dashboard/admin/request/exceptions/approver/${rowData._id}/${rowData.approverId}`
              );
            }}
          />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.father_name}</HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.mother_name}</HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="approverSelfieSkipStatus" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              navigate(
                `/dashboard/admin/request/exceptions/approver/${rowData._id}/${rowData.approverId}`
              );
            }}
          />
        </Column>
      </Table>
    </>
  );
}

export default List;
