import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { ActionCell } from "@/components/table/actions";
import { ActionType } from "@/types/Table";
import { onSort } from "@/utils/common/sort";
import { useNavigate } from "react-router-dom";
import { CenterType } from "@/types/Center";
import Modal from "@/components/Modal";
import DeleteData from "@/components/Modal/DeleteModal";
import AddCenter from "./add";
import { get } from "lodash";
import { defineAccess } from "@/utils/common/permissions";
import ConcatNameCell from "@/components/table/concatNameCell";
import { ArrayCell } from "@/components/table/arrayCell";
import { StatusCell } from "@/components/table/status";

const { Column, HeaderCell, Cell } = LibTable;

interface RequestData {
  _id: string;
  capacity?: string | number;
  province: string;
  district: string;
  sector: string;
  center: string;
  cell: string;
  [key: string]: any;
}

interface ListProps {
  data: CenterType[];
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

function List({ data, totalPages, loading, fetchData }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof RequestData>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedData, setSelectedData] = useState<CenterType>();
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    centerModal: false,
    deleteModal: false,
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
      offset: dataKey - 1,
      limit: 10,
    });
  };

  const handleModal = (modal: string, action: boolean, item?: CenterType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof RequestData;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const actions: ActionType[] = [
    // {
    //   name: translation.reports,
    //   icon: "bar_chart",
    //   onClick: (rowData) =>
    //     rowData && rowData?._id
    //       ? navigate(`/dashboard/admin/reports/${rowData?._id}`)
    //       : console.log("Selected Row Center table _id is missing"),
    // },
  ];

  const canUpdate = defineAccess({
    method: "update",
    module: "centers",
  });

  const canDelete = defineAccess({
    method: "delete",
    module: "centers",
  });

  if (canUpdate) {
    actions.push({
      name: translation.edit,
      icon: "edit",
      onClick: (rowData: any) => handleModal("centerModal", true, rowData),
    });
  }

  if (canDelete) {
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
            sortColumn: sortColumn as keyof RequestData,
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
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.center}</HeaderCell>
          <CompactCell dataKey="name" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">
            {translation.contact_number}
          </HeaderCell>
          <CompactCell dataKey="contactNumber" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.short_name}</HeaderCell>
          <CompactCell dataKey="shortName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.capacity}</HeaderCell>
          <CompactCell dataKey="capacity" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.country}</HeaderCell>
          <CompactCell dataKey="country" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable minWidth={500}>
          <HeaderCell className="textBold">{translation.address}</HeaderCell>
          <ConcatNameCell
            dataKey={["province", "district", "sector", "cell", "village"]}
          />
        </Column>

        <Column flexGrow={1} fullText sortable resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.level}</HeaderCell>
          <StatusCell dataKey="centerLevelName" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column flexGrow={1} fullText sortable resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.category}</HeaderCell>
          <ArrayCell
            dataKey="centerTypeDetail"
            title={translation.category}
            fieldName="value"
          >
            {translation.supporting_documents}
          </ArrayCell>
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>

      <Modal
        show={modal.centerModal}
        title={translation.center}
        handleClose={() => handleModal("centerModal", false)}
      >
        <AddCenter
          handleClose={() => handleModal("centerModal", false)}
          fetchData={() => fetchData({})}
          selectedData={selectedData}
        />
      </Modal>

      <Modal
        show={modal.deleteModal}
        title={translation.delete_data}
        handleClose={() => handleModal("deleteModal", false)}
      >
        <DeleteData
          secretText={selectedData?.name || ""}
          handleCloseModal={() => handleModal("deleteModal", false)}
          url={`/configuration/centers/${selectedData?._id}`}
          refreshListData={fetchData}
          data={{
            centerId: selectedData?._id,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
