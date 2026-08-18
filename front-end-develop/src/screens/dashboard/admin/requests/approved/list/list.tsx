import Table from "@/components/table";
import {
  Table as LibTable,
  List,
  Modal as LibModal,
  ButtonToolbar,
} from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { EnrollmentType } from "@/types/Enrollment";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { ImageCell } from "@/components/table/image";
import { DateCell } from "@/components/table/date";
import { LinkCell } from "@/components/table/linkCell";
import Modal from "@/components/Modal";
import Button from "@/components/button";

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

function ListC({ data, totalPages, loading, setFilters }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof EnrollmentType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [officer, setOfficer] = useState<any>({});
  const [open, setOpen] = useState(false);

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
        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>Sdid-EN</HeaderCell>
          <LinkCell
            onClick={(rowData) => {
              navigate("/dashboard/admin/enrollment/" + rowData._id);
            }}
            dataKey="enrollmentNumber"
          />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.category}</HeaderCell>
          <CompactCell dataKey="applicantCategory" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>
        {/* <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.father_name}</HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.mother_name}</HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column> */}
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.enrollment_date}</HeaderCell>
          <DateCell dataKey="enrollmentDate" formatTime="lll" />
        </Column>
        {/* <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.enrollment_officer}</HeaderCell>
          <LinkCell
            dataKey="officer.idNumber"
            onClick={(rowData: any) => {
              setOfficer(rowData?.officer || {});
              setOpen(true);
            }}
          />
        </Column> */}
        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              navigate("/dashboard/admin/enrollment/" + rowData._id);
            }}
          />
        </Column>
      </Table>

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.officer}
      >
        <List>
          <List.Item>
            {translation.first_name}: {officer.firstName}
          </List.Item>
          <List.Item>
            {translation.last_name}: {officer.lastName}
          </List.Item>
          <List.Item>
            {translation.id_number}: {officer.idNumber}
          </List.Item>
          <List.Item>
            {translation.center}: {officer.centerName}
          </List.Item>
        </List>
        <LibModal.Footer>
          <ButtonToolbar>
            <Button text={translation.close} onClick={() => setOpen(true)} />
          </ButtonToolbar>
        </LibModal.Footer>
      </Modal>
    </>
  );
}

export default ListC;
