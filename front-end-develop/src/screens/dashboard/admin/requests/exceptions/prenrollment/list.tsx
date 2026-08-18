import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { EnrollmentType } from "@/types/Enrollment";
import { useNavigate } from "react-router-dom";
import ConcatNameCell from "@/components/table/concatNameCell";
import { StatusCell } from "@/components/table/status";
import { ImageCell } from "@/components/table/image";
import ViewInfo from "../viewInfo";
import { DateCell } from "@/components/table/date";
import { LinkCell } from "@/components/table/linkCell";
import { Prenrollment } from "@/types/Prenrollment";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: EnrollmentType[];
  totalPages: number;
  loading: boolean;
  setFilters: (e: any) => void;
  fetchData: () => void;
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, totalPages, loading, setFilters, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof EnrollmentType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<EnrollmentType | null>(null);

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
          <ImageCell dataKey="selfieForSkip" name={["firstName", "lastName"]} />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <LinkCell
            dataKey="preEnrollmentNumber"
            onClick={(rowData) => {
              setSelectedData(rowData);
              setOpen(true);
            }}
          />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.identifier}</HeaderCell>
          <CompactCell dataKey="identifier" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.father_name}</HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.mother_name}</HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.code}</HeaderCell>
          <StatusCell dataKey="selfieVerificationSkipCode" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.selfie_skip_status}</HeaderCell>
          <StatusCell dataKey="selfieVerificationSkipStatus" />
        </Column>

        {/* <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.selfie_skip_status}</HeaderCell>
          <StatusCell dataKey="selfieVerificationSkipStatus" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.enrollment_status}</HeaderCell>
          <StatusCell dataKey="enrollmentStatus" />
        </Column> */}

        {/* <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.requested}</HeaderCell>
          <DateCell dataKey="selfieVerificationSkipRequestedAt" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.approved}</HeaderCell>
          <DateCell dataKey="selfieVerificationSkipApprovedAt" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.rejected}</HeaderCell>
          <DateCell dataKey="selfieVerificationSkipRejectedAt" />
        </Column> */}

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="preEnrollmentNumber"
            onClick={(rowData) => {
              // if (rowData.selfieVerificationSkipApprovedAt !== "") {
              //   return;
              // }
              setSelectedData(rowData);
              setOpen(true);
            }}
          />
        </Column>
      </Table>

      {selectedData && (
        <ViewInfo
          preEnrollmentId={selectedData._id}
          open={open}
          setOpen={setOpen}
          data={selectedData}
          setRefresh={() => fetchData()}
        />
      )}
    </>
  );
}

export default List;
