import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { DateCell } from "@/components/table/date";
import { Draft } from "@/types/Draft";
import { LinkCell } from "@/components/table/linkCell";
import FacialAuth from "@/components/facialAuth";
import Modal from "@/components/Modal";
import { useFetchPrenrollmentByPrenrollmentNo } from "@/hooks/useFetchPrenrollment";
import toastMessage from "@/utils/common/toastMessage";
import { EnrollmentType } from "@/types/Enrollment";
import Loading from "@/components/loader";
import { ImageCell } from "@/components/table/image";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: Draft[];
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
  const [sortColumn, setSortColumn] = useState<keyof Draft>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [openFacialModal, setOpenFacialModal] = useState(false);
  const [selectedData, setSelectedData] = useState<EnrollmentType>(
    {} as EnrollmentType
  );
  const {
    loading: loadingPrenrollment,
    fetchPrenrollmentByPrenrollmentNoData,
  } = useFetchPrenrollmentByPrenrollmentNo();

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
      offset: dataKey - 1,
      limit: 10,
    }));
  };
  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof Draft;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleRedirection = async (rowData: EnrollmentType) => {
    const data = await fetchPrenrollmentByPrenrollmentNoData(
      rowData.preEnrollmentNumber
    );

    if (!data) return toastMessage("error", translation.no_data_found);
    setSelectedData({
      preEnrollmentId: data._id,
      ...rowData,
    });

    setOpenFacialModal(true);
  };

  return (
    <>
      {loadingPrenrollment && (
        <center>
          <Loading />
        </center>
      )}
      <Table
        data={onSort({
          data,
          sortColumn,
          sortType,
        })}
        handleSortClick={({ sortColumn, sortType }) =>
          handleSortClick({
            sortColumn: sortColumn as keyof Draft,
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

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.applicant_category}</HeaderCell>
          <CompactCell dataKey="applicantCategory" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <LinkCell
            onClick={(rowData) => {
              handleRedirection(rowData);
            }}
            dataKey="preEnrollmentNumber"
          />
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
          <HeaderCell>{translation.father_name}</HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.mother_name}</HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.date}</HeaderCell>
          <DateCell dataKey="createdAt" formatTime="lll" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              handleRedirection(rowData);
            }}
          />
        </Column>
      </Table>

      <Modal
        show={openFacialModal}
        handleClose={() => setOpenFacialModal(false)}
        title={selectedData.preEnrollmentNumber}
        size="xs"
      >
        <FacialAuth
          setOpen={(b) => setOpenFacialModal(b)}
          prenrollmentId={selectedData.preEnrollmentId}
          preEnrollmentNo={selectedData.preEnrollmentNumber}
          phoneNumber={selectedData.phoneNumber}
          resumeId={selectedData._id}
          photo={selectedData.selfie}
          isResuming={true}
          requestNumber={selectedData.requestNo}
        />
      </Modal>
    </>
  );
}

export default List;
