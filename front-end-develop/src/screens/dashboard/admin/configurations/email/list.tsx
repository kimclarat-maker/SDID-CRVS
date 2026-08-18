import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import { EmailType, SMSType } from "@/types/Configuration";
import AddEmail from "./add";
import { FilterContext } from "@/context/FilterContext";
import DeleteData from "@/components/Modal/DeleteModal";
import { BooleanCell } from "@/components/table/cellBoolean";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

interface ListProps {
  data: DocumentType[];
  loading: boolean;
  fetchData: () => void;
}

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof EmailType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [selectedData, setSelectedData] = useState<EmailType>();
  const [page, setPage] = useState(1);
  const { setFilters } = useContext(FilterContext);
  const [limit, setLimit] = useState(10);

  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof EmailType;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleChangeLimit = (dataKey: number) => {
    setPage(page);
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      email: {
        ...prev.sms,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      email: {
        ...prev.sms,
        page: dataKey,
        limit: 10,
      },
    }));
  };

  const actions: ActionType[] = [];

  const canUpdate = defineAccess({
    method: "update",
    module: "emailSettings",
  });

  const canDelete = defineAccess({
    method: "delete",
    module: "emailSettings",
  });

  if (canUpdate) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("addModal", true, rowData),
    });
  }

  if (canDelete) {
    actions.push({
      name: translation.delete,
      icon: "delete",
      onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
    });
  }

  const handleModal = (modal: string, action: boolean, item?: EmailType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
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
            sortColumn: sortColumn as keyof SMSType,
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
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.email_from_address}
          </HeaderCell>
          <CompactCell dataKey="fromAddress" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.smtp_address}
          </HeaderCell>
          <CompactCell dataKey="smtpAddress" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.smtp_port_address}
          </HeaderCell>
          <CompactCell dataKey="smtpPort" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.ssl_enabled}
          </HeaderCell>
          <BooleanCell dataKey="sslEnable" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <BooleanCell dataKey="status" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.username}</HeaderCell>
          <CompactCell dataKey="username" />
        </Column>

        {actions.length > 0 && (
          <Column flexGrow={1} minWidth={150}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ActionCell actions={actions} />
          </Column>
        )}
      </Table>

      <Modal
        show={modal.addModal}
        title={translation.email_configuration}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddEmail
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
          selectedData={selectedData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title=""
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?.name || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/configuration/email-settings/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            documentTypeId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
