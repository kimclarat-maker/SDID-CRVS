import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Modal from "@/components/Modal";
import AddSMS from "./add";
import { SMSType } from "@/types/Configuration";
import { FilterContext } from "@/context/FilterContext";
import { StatusCell } from "@/components/table/status";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

interface ListProps {
  data: SMSType[];
  loading: boolean;
  fetchData: () => void;
}

function List({ data, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof SMSType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<SMSType>();
  const { setFilters } = useContext(FilterContext);

  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });

  const handleChangeLimit = (dataKey: number) => {
    setPage(page);
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      sms: {
        ...prev.sms,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      sms: {
        ...prev.sms,
        page: dataKey,
        limit: 10,
      },
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof SMSType;
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
    module: "smsSettings",
  });

  if (canUpdate) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("addModal", true, rowData),
    });
  }

  const handleModal = (modal: string, action: boolean, item?: SMSType) => {
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
        <Column fullText sortable resizable flexGrow={1} minWidth={200}>
          <HeaderCell className="textBold">{translation.scope}</HeaderCell>
          <CompactCell dataKey="scope" />
        </Column>

        <Column fullText sortable resizable flexGrow={1} minWidth={200}>
          <HeaderCell className="textBold">
            {translation.sms_provider}
          </HeaderCell>
          <CompactCell dataKey="smsProvider" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell className="textBold">
            {translation.sms_api_key}
          </HeaderCell>
          <CompactCell dataKey="apiKey" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell className="textBold">{translation.service_id}</HeaderCell>
          <CompactCell dataKey="serviceId" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell className="textBold">
            {translation.effective_date}
          </HeaderCell>
          <CompactCell dataKey="effectiveDate" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
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
        title={translation.new_configuration}
        handleClose={() => handleModal("addModal", false)}
      >
        <AddSMS
          handleClose={() => handleModal("addModal", false)}
          fetchData={fetchData}
          selectedData={selectedData}
        />
      </Modal>
    </>
  );
}

export default List;
