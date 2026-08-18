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
import { FilterContext } from "@/context/FilterContext";
import AddOffDays from "./add";
import { get } from "lodash";
import { DateCell } from "@/components/table/date";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: any[];
  loading: boolean;
  fetchData: () => void;
  centerId: string;
  offdays: string[];
}

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function List({ data, loading, fetchData, centerId, offdays }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [selectedData, setSelectedData] = useState<CenterType>();
  const [modal, setModal] = useState({
    offdayModal: false,
    deleteModal: false,
  });

  const handleModal = (modal: string, action: boolean, item?: CenterType) => {
    setModal((prev) => ({
      ...prev,
      [modal]: action,
    }));

    if (item) {
      setSelectedData(item);
    }
  };

  const actions: ActionType[] = [
    {
      name: translation.delete,
      icon: "delete",
      onClick: (rowData: any) => handleModal("deleteModal", true, rowData),
    },
  ];

  return (
    <>
      <Table
        data={onSort({
          data,
        })}
        loading={loading}
      >
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell className="textBold">{translation.date}</HeaderCell>
          <DateCell dataKey="date" />
        </Column>

        <Column resizable minWidth={80}>
          <HeaderCell className="textBold">{translation.action}</HeaderCell>
          <ActionCell actions={actions} />
        </Column>
      </Table>

      <Modal
        show={modal.offdayModal}
        title={translation.account}
        handleClose={() => handleModal("offdayModal", false)}
      >
        <AddOffDays
          handleClose={() => handleModal("offdayModal", false)}
          fetchData={fetchData}
          selectedData={selectedData}
          centerId={centerId}
          offdays={offdays}
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
          url={`/configuration/centers/${centerId}/offday`}
          refreshListData={fetchData}
          data={{
            offday: selectedData?.date,
          }}
        />
      </Modal>
    </>
  );
}

export default List;
