import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import AddDevice from "./add";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import { AccountType } from "@/types/Account";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";
import { StatusCell } from "@/components/table/status";
import { Link } from "react-router-dom";
import { DeviceType } from "@/types/Device";
import ConcatNameCell from "@/components/table/concatNameCell";
import AuditLogs from "./auditlogs/audit";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: AccountType[];
  totalPages?: number;
  loading: boolean;
  fetchData: (e: any) => void;
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

const LinkCell = ({ rowData, dataKey, onClick, ...props }: any) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default anchor behavior
    onClick(rowData);
  };

  return (
    <Cell {...props}>
      <Link to="#" onClick={handleClick}>
        {rowData[dataKey]}
      </Link>
    </Cell>
  );
};

function List({ data, totalPages, loading, fetchData, setFilters }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof DeviceType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<DeviceType>();
  const [modal, setModal] = useState({
    deviceModal: false,
    deleteModal: false,
    logModal: false,
  });

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
    sortColumn: keyof AccountType;
    sortType: string;
  }) => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    setFilters((prev: any) => ({
      ...prev,
      order: sortType,
    }));
  };

  const handleModal = (modal: string, action: boolean, item?: DeviceType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [];

  if (defineAccess({ method: "UPDATE", module: "deviceManagement" })) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("deviceModal", true, rowData),
    });
  }

  if (defineAccess({ method: "GET", module: "deviceManagement" })) {
    actions.push({
      name: translation.logs,
      icon: "article_person",
      onClick: (rowData: any) => handleModal("logModal", true, rowData),
    });
  }

  if (defineAccess({ method: "DELETE", module: "deviceManagement" })) {
    actions.push({
      name: translation.delete,
      icon: "delete",
      onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
    });
  }

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
            sortColumn: sortColumn as keyof DeviceType,
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
        <Column fullText resizable flexGrow={1} minWidth={200}>
          <HeaderCell className="textBold">
            {translation.serial_number}
          </HeaderCell>
          <LinkCell
            dataKey="serialNumber"
            onClick={(rowData: any) =>
              handleModal("deviceModal", true, rowData)
            }
          />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.type}</HeaderCell>
          <CompactCell dataKey="deviceType" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.name}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="center.name" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.assignee}</HeaderCell>
          <ConcatNameCell dataKey={["account.firstName", "account.lastName"]} />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">
            {translation.assignment_status}
          </HeaderCell>
          <StatusCell dataKey="assignmentStatus" />
        </Column>

        {actions.length > 0 && (
          <Column width={80}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ActionCell actions={actions} />
          </Column>
        )}
      </Table>
      <Modal
        show={modal.deviceModal}
        title={translation.device_details}
        handleClose={() => handleModal("deviceModal", false)}
      >
        <AddDevice
          handleClose={() => handleModal("deviceModal", false)}
          selectedData={selectedData}
          fetchData={() => fetchData({})}
        />
      </Modal>

      <Modal
        show={modal.logModal}
        title={translation.logs}
        handleClose={() => handleModal("logModal", false)}
      >
        <div
          className="rs-modal-body"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <AuditLogs deviceId={selectedData?._id} />
        </div>
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?.firstName || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/devices/${selectedData?._id}`}
          refreshListData={() => fetchData({})}
          data={{
            accountId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
