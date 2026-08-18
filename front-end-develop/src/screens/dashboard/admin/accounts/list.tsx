import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ImageCell } from "@/components/table/image";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import AddAccount from "./add";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import { AccountType } from "@/types/Account";
import ListAccessRoles from "../accessRoles/roles/list";
import Profile from "@/components/profile";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";
import { StatusCell } from "@/components/table/status";
import { Link, useNavigate } from "react-router-dom";
import { DateCell } from "@/components/table/date";
import Transfer from "@/components/forms/account/transfer";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: AccountType[];
  totalPages: number;
  loading: boolean;
  fetchData: (e: any) => void;
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

function List({ data, totalPages, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof AccountType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<AccountType>();
  const [modal, setModal] = useState({
    accountModal: false,
    deleteModal: false,
    accessRolesModal: false,
    profileModal: false,
    transferModal: false,
    logModal: false,
  });

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
    sortColumn: keyof AccountType;
    sortType: string;
  }) => {
    setSortColumn(sortColumn);
    setSortType(sortType);
    fetchData({
      order: sortType,
    });
  };

  const handleModal = (modal: string, action: boolean, item?: AccountType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [];

  if (defineAccess({ method: "UPDATE", module: "account" })) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("accountModal", true, rowData),
    });
  }

  if (defineAccess({ method: "UPDATE", module: "account" })) {
    actions.push({
      name: translation.center,
      icon: "source_environment",
      onClick: (rowData: any) => handleModal("transferModal", true, rowData),
    });
  }

  if (defineAccess({ method: "GET", module: "logs" })) {
    actions.push({
      name: translation.logs,
      icon: "article_person",
      onClick: (rowData: any) => handleModal("logModal", true, rowData),
    });
  }

  if (defineAccess({ method: "DELETE", module: "account" })) {
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
            sortColumn: sortColumn as keyof AccountType,
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
        <Column width={60} align="center">
          <HeaderCell className="textBold">{translation.photo}</HeaderCell>
          <ImageCell dataKey="photo" name={["firstName", "lastName"]} />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={200}>
          <HeaderCell className="textBold">{translation.id_number}</HeaderCell>
          <LinkCell
            dataKey="idNumber"
            onClick={(rowData: any) =>
              handleModal("accountModal", true, rowData)
            }
          />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.first_name}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.last_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">
            {translation.email_address}
          </HeaderCell>
          <CompactCell dataKey="email" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">
            {translation.phone_number}
          </HeaderCell>
          <CompactCell dataKey="phoneNumber" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="center.name" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.role}</HeaderCell>
          <CompactCell dataKey="accessRole.name" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column fullText resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">
            {translation.created_date}
          </HeaderCell>
          <DateCell dataKey="postedDate" />
        </Column>

        <Column width={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>
      <Modal
        show={modal.accountModal}
        title={translation.account}
        handleClose={() => handleModal("accountModal", false)}
        size="lg"
      >
        <AddAccount
          handleClose={() => handleModal("accountModal", false)}
          selectedData={selectedData}
          fetchData={() => fetchData({})}
        />
      </Modal>

      <Modal
        show={modal.profileModal}
        title={translation.account}
        handleClose={() => handleModal("profileModal", false)}
        size="lg"
      >
        <div style={{ padding: "0 1rem" }}>
          <Profile {...selectedData} showLogs />
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
          url={`/accounts/${selectedData?._id}`}
          refreshListData={() => fetchData({})}
          data={{
            accountId: selectedData?._id,
          }}
        />
      </Modal>

      <Modal
        show={modal.accessRolesModal}
        title={translation.access_role}
        handleClose={() => handleModal("accessRolesModal", false)}
      >
        {selectedData && (
          <ListAccessRoles
            data={[selectedData.accessRole]}
            totalPages={1}
            loading={false}
            fetchData={() => fetchData({})}
            paginationLayout={["pager"]}
          />
        )}
      </Modal>

      <Modal
        show={modal.transferModal}
        title={translation.transfer}
        handleClose={() => handleModal("transferModal", false)}
      >
        {selectedData && (
          <Transfer
            account={selectedData}
            fetchData={() => fetchData({})}
            handleCloseModal={() => handleModal("transferModal", false)}
          />
        )}
      </Modal>
    </>
  );
}

export default List;
