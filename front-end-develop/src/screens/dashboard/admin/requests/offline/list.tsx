import Table from "@/components/table";
import { Table as LibTable, List as LibList, Stack } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { useNavigate } from "react-router-dom";
import { StatusCell } from "@/components/table/status";
import { DateCell } from "@/components/table/date";
import { RollBack } from "@/types/RollBack";
import Modal from "@/components/Modal";
import InfoCard from "@/components/profile/infoCard/infoCard";
import { EnrollmentType } from "@/types/Enrollment";
import { ImageCell } from "@/components/table/image";
import { LinkCell } from "@/components/table/linkCell";
import { CheckboxCell } from "@/components/table/checkboxCell";
import { isDemoMode } from "@/demo/config";
import { demoSyncOfflineApplication } from "@/demo/services/applications";
import { getStorage } from "@/utils/storage";
import Button from "@/components/button";
import toastMessage from "@/utils/common/toastMessage";

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

function List({ data, totalPages, loading, setFilters }: ListProps) {
  const { translation } = useContext(LanguageContext);
  const [sortColumn, setSortColumn] = useState<keyof RollBack>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();
  const [selectedData, setSelectedData] = useState<any>({});
  const [open, setOpen] = useState(false);

  const handleChangeLimit = (dataKey: number) => {
    setLimit(dataKey);

    setFilters((prevFilters: any) => ({
      ...prevFilters,
      limit: dataKey,
    }));
  };

  const handleChangePage = (dataKey: number) => {
    setPage(dataKey);

    setFilters((prevFilters: any) => ({
      ...prevFilters,
      offset: dataKey - 1,
      limit: 10,
    }));
  };

  const handleSortClick = ({
    sortColumn,
    sortType,
  }: {
    sortColumn: keyof RollBack;
    sortType: string;
  }) => {
    setTimeout(() => {
      setSortColumn(sortColumn);
      setSortType(sortType);
    }, 500);
  };

  const handleNavigation = (rowData: any) => {
    if (!rowData) return;
    if (rowData.status?.toUpperCase() === "APPROVED") {
      return navigate(`/dashboard/admin/enrollment/${rowData._id}`);
    } else {
      return navigate(
        `/dashboard/admin/prenrollment/search?prq=${rowData.preEnrollmentNumber}`
      );
    }

    setOpen(true);
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
            sortColumn: sortColumn as keyof RollBack,
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
          <HeaderCell>{translation.photo}</HeaderCell>
          <ImageCell name={["firstName", "lastName"]} dataKey="selfie" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <LinkCell onClick={handleNavigation} dataKey="preEnrollmentNumber" />
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
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="status" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.synced}</HeaderCell>
          <CheckboxCell dataKey="syncedToCentral" />
        </Column>

        {isDemoMode() && (
          <Column resizable minWidth={150}>
            <HeaderCell>Demo sync</HeaderCell>
            <Cell>
              {(rowData: any) =>
                rowData.syncedToCentral ? (
                  <span>Synced</span>
                ) : (
                  <Button
                    text="Simulate sync"
                    size="xs"
                    appearance="ghost"
                    type="button"
                    onClick={async () => {
                      const user = await getStorage();
                      const outcome = await demoSyncOfflineApplication(
                        rowData._id,
                        `${user?.firstName} ${user?.lastName}`
                      );
                      toastMessage(
                        outcome === "synced" ? "success" : "error",
                        outcome === "synced"
                          ? "Offline application synchronised (demo)."
                          : "Simulated sync failure — retry."
                      );
                      setFilters((prev: any) => ({ ...prev }));
                    }}
                  />
                )
              }
            </Cell>
          </Column>
        )}

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            appearance="primary"
            onClick={(rowData) => handleNavigation(rowData)}
          />
        </Column>
      </Table>

      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={`${translation[selectedData?.status] || selectedData?.status} `}
        size="lg"
      >
        {selectedData && (
          <InfoCard {...selectedData} photoPlacement="right" size={8} show />
        )}
      </Modal>
    </>
  );
}

export default List;
