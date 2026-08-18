import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import Add from "./add";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import { FilterContext } from "@/context/FilterContext";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";
import { SupportingDocumentTypes } from "@/types/SupportingDocument";
import { ArrayCell } from "@/components/table/arrayCell";
import { BooleanCell } from "@/components/table/cellBoolean";
import { useNavigate } from "react-router-dom";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: any;
  totalPages: number;
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

function List({ data, totalPages, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof SupportingDocumentTypes>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { setFilters } = useContext(FilterContext);
  const [selectedData, setSelectedData] = useState<SupportingDocumentTypes>();
  const [modal, setModal] = useState({
    addModal: false,
    deleteModal: false,
  });
  const navigate = useNavigate();

  const handleChangeLimit = (dataKey: number) => {
    setPage(page);
    setLimit(dataKey);

    setFilters((prev: any) => ({
      ...prev,
      sDocument: {
        ...prev.sDocument,
        offset: page,
        limit: dataKey,
      },
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);
    setFilters((prev: any) => ({
      ...prev,
      sDocument: {
        ...prev.sDocument,
        offset: dataKey,
        limit: 10,
      },
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof SupportingDocumentTypes;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleModal = (
    modal: string,
    action: boolean,
    item?: SupportingDocumentTypes
  ) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [];

  if (defineAccess({ method: "GET", module: "supportingdocuments" })) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("addModal", true, rowData),
    });
  }

  if (defineAccess({ method: "DELETE", module: "supportingdocuments" })) {
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
            sortColumn: sortColumn as keyof SupportingDocumentTypes,
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
        <Column fullText sortable resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.field_name}</HeaderCell>
          <CompactCell dataKey="fieldNames" />
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">
            {translation.document_type}
          </HeaderCell>
          <ArrayCell
            dataKey="documentTypes"
            title={translation.supporting_documents}
          >
            {translation.supporting_documents}
          </ArrayCell>
        </Column>

        <Column fullText flexGrow={1} resizable>
          <HeaderCell className="textBold">
            {translation.allowed_format}
          </HeaderCell>
          <ArrayCell
            dataKey="allowedFormats"
            title={translation.allowed_supporting_formats}
          >
            {translation.allowed_supporting_formats}
          </ArrayCell>
        </Column>

        <Column fullText sortable resizable flexGrow={1} minWidth={150}>
          <HeaderCell className="textBold">{translation.required}</HeaderCell>
          <BooleanCell dataKey="isRequired" />
        </Column>

        <Column width={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>
      <Modal
        show={modal.addModal}
        title={translation.supporting_documents}
        handleClose={() => handleModal("addModal", false)}
      >
        <Add
          handleClose={() => handleModal("addModal", false)}
          getData={fetchData}
          selectedData={selectedData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?._id || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/configuration/supporting-documents/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            _id: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
