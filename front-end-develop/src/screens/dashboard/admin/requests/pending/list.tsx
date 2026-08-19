import Table from "@/components/table";
import { Table as LibTable } from "rsuite";
import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { onSort } from "@/utils/common/sort";
import { get } from "lodash";
import ButtonCell from "@/components/table/button/buttonCell";
import { EnrollmentType } from "@/types/Enrollment";
import { useNavigate } from "react-router-dom";
import ConcatNameCell from "@/components/table/concatNameCell";
import { StatusCell } from "@/components/table/status";
import { ImageCell } from "@/components/table/image";
import Modal from "@/components/Modal";
import Enrollment from "../../biometrics/biometricCapture/enrollmentStatus";
import { LinkCell } from "@/components/table/linkCell";
import { calculateAge } from "@/utils/common/age";
import { isDemoMode } from "@/demo/config";
import {
  demoApproveApplication,
  demoRejectApplication,
} from "@/demo/services/applications";
import { getStorage } from "@/utils/storage";
import Button from "@/components/button";
import toastMessage from "@/utils/common/toastMessage";

const { Column, HeaderCell, Cell } = LibTable;

interface ListProps {
  data: EnrollmentType[];
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
  const [sortColumn, setSortColumn] = useState<keyof EnrollmentType>();
  const [sortType, setSortType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<EnrollmentType>(
    {} as EnrollmentType
  );

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
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <LinkCell
            dataKey="preEnrollmentNumber"
            onClick={(rowData) => {
              setSelectedData(rowData);
              setOpenModal(true);
            }}
          />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.identifier}</HeaderCell>
          <CompactCell dataKey="identifier" />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.father_name}</HeaderCell>
          <CompactCell dataKey="fatherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={200}>
          <HeaderCell>{translation.mother_name}</HeaderCell>
          <CompactCell dataKey="motherNames" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable minWidth={150}>
          <HeaderCell>{translation.enrollment_officer}</HeaderCell>
          <ConcatNameCell dataKey={["officer.firstName", "officer.lastName"]} />
        </Column>

        {isDemoMode() && (
          <Column resizable minWidth={190}>
            <HeaderCell>Demo review</HeaderCell>
            <Cell>
              {(rowData: any) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    text="Approve"
                    size="xs"
                    appearance="primary"
                    type="button"
                    onClick={async () => {
                      const user = await getStorage();
                      await demoApproveApplication(
                        rowData._id,
                        `${user?.firstName} ${user?.lastName}`
                      );
                      toastMessage("success", "Application approved (demo).");
                      fetchData({});
                    }}
                  />
                  <Button
                    text="Reject"
                    size="xs"
                    appearance="ghost"
                    color="red"
                    type="button"
                    onClick={async () => {
                      const user = await getStorage();
                      await demoRejectApplication(
                        rowData._id,
                        `${user?.firstName} ${user?.lastName}`
                      );
                      toastMessage("success", "Application rejected (demo).");
                      fetchData({});
                    }}
                  />
                </div>
              )}
            </Cell>
          </Column>
        )}

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              setSelectedData(rowData);
              setOpenModal(true);
            }}
          />
        </Column>
      </Table>

      <Modal show={openModal} handleClose={() => setOpenModal(false)}>
        {selectedData && selectedData?._id && (
          <Enrollment
            enrollmentId={selectedData._id}
            setOpen={setOpenModal}
            page="pending"
            age={
              selectedData.age
                ? typeof selectedData.age === "string"
                  ? Number(selectedData.age)
                  : selectedData.age
                : calculateAge(selectedData.dob)
            }
          />
        )}
      </Modal>
    </>
  );
}

export default List;
