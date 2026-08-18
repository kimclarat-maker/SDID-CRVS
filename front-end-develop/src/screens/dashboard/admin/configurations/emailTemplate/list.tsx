import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import AddEmailTemplate from "./add";
import DeleteData from "@/components/Modal/DeleteModal";
import { FilterContext } from "@/context/FilterContext";
import { EmailTemplateTypes } from "@/types/Email";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

const { Column, HeaderCell, Cell } = LibTable;

interface EmailTemplate {
  flowId: string;
  emailSub: string;
  emailText: string;
  effectiveDate: string;
}

interface ListProps {
  data: EmailTemplate[];
  loading: boolean;
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

function List({ data, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof EmailTemplateTypes>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { setFilters } = useContext(FilterContext);
  const [selectedData, setSelectedData] = useState<EmailTemplateTypes>();

  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleChangeLimit = (dataKey: number) => {
    setPage(0);
    setLimit(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      emailTemplate: {
        offset: 0,
        limit: dataKey,
      },
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof EmailTemplateTypes;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const actions: ActionType[] = [];

  const canUpdate = defineAccess({
    method: "update",
    module: "emailTemplates",
  });

  const canDelete = defineAccess({
    method: "delete",
    module: "emailTemplates",
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

  const handleModal = (
    modal: string,
    action: boolean,
    item?: EmailTemplateTypes
  ) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      page: dataKey,
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
        handleSortClick={({ sortColumn, sortType }) =>
          handleSortClick({
            sortColumn: sortColumn as keyof EmailTemplateTypes,
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
        <Column fullText resizable>
          <HeaderCell className="textBold">{translation.flow_id}</HeaderCell>
          <CompactCell dataKey="flowId" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.subject}</HeaderCell>
          <CompactCell dataKey="emailSub" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">{translation.message}</HeaderCell>
          <CompactCell dataKey="emailText" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell className="textBold">
            {translation.effective_date}
          </HeaderCell>
          <CompactCell dataKey="effectiveDate" />
        </Column>

        {actions.length > 0 && (
          <Column flexGrow={1}>
            <HeaderCell className="textBold">{translation.action}</HeaderCell>
            <ActionCell actions={actions} />
          </Column>
        )}
      </Table>

      <Modal
        show={modal.addModal}
        title={translation.message_configuration}
        handleClose={() => handleModal("addModal", false)}
        size="lg"
      >
        <AddEmailTemplate
          handleClose={() => handleModal("addModal", false)}
          selectedData={selectedData}
          fetchData={fetchData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?.flowId || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/configuration/email-templates/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            emailTemplateId: selectedData?.sno,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
