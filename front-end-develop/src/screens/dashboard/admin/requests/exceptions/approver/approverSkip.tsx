import { useContext, useEffect, useState } from "react";
import { Header, IconButton, Stack, Text, Table as LibTable } from "rsuite";
import { get } from "lodash";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Loading from "@/components/loader";
import { LanguageContext } from "@/context/LanguageContext";
import Icon from "@/components/icon";
import { goBack } from "@/utils/common/goBack";
import { Prenrollment } from "@/types/Prenrollment";
import ButtonCell from "@/components/table/button/buttonCell";
import { ImageCell } from "@/components/table/image";
import Table from "@/components/table";
import ViewInfo from "../viewInfo";
import { StatusCell } from "@/components/table/status";
import toastMessage from "@/utils/common/toastMessage";
import { fetchEnrollmentById } from "@/api/enrollments";
import { EnrollmentType } from "@/types/Enrollment";
import { useFetchAccountById } from "@/hooks/useAccounts";
import Button from "@/components/button";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function ApproverSkip({ isBioRefresh }: { isBioRefresh?: boolean }) {
  const navigate = useNavigate();
  const { translation } = useContext(LanguageContext);
  const { enrollmentId, accountId } = useParams();
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<Prenrollment>();
  const [loading, setLoading] = useState(false);
  const { fetchAccountData, data } = useFetchAccountById();
  let [enrollmentData, setEnrollmentData] = useState<EnrollmentType>();
  const [searchParams] = useSearchParams();
  const isStartedOnline = searchParams.get("isRemoteFetch") === "true";

  const fetchData = async () => {
    try {
      if (!enrollmentId) return;
      setLoading(true);
      const data: any = await fetchEnrollmentById(
        enrollmentId,
        isStartedOnline
      );
      setEnrollmentData(data.data);

      if (data?.data?.approverId) {
        await fetchAccountData(data?.data?.approverId, isStartedOnline);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastMessage("error", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [enrollmentId]);

  if (loading) {
    return <Loading isFullScreen />;
  }

  return (
    <>
      <Header>
        <Stack spacing={18}>
          <Stack.Item>
            <IconButton
              icon={<Icon name="arrow_left_alt" />}
              onClick={() => goBack(navigate)}
              text={translation.go_back}
              data-testid="back-button"
            />
          </Stack.Item>
          <Stack.Item>
            <Text>
              {translation.pair_validator}{" "}
              {enrollmentData && enrollmentData.preEnrollmentNumber}
            </Text>
          </Stack.Item>
          <Stack.Item grow={1} />
          <Stack.Item>
            <Button
              startIcon="refresh"
              onClick={fetchData}
              text={translation.refresh}
              data-testid="refresh-button"
            />
          </Stack.Item>
        </Stack>
      </Header>

      <br />

      <Table
        data={
          data?._id
            ? [
                {
                  ...data,
                  approverSelfieSkipCode:
                    enrollmentData?.approverSelfieSkipCode,
                  approverSelfieSkipStatus:
                    enrollmentData?.approverSelfieSkipStatus,
                  approverSelfieForSkip: enrollmentData?.approverSelfieForSkip,
                  approverSelfieSkipExpiresAt:
                    enrollmentData?.approverSelfieSkipExpiresAt,
                  approverSelfieSkipRequestedAt:
                    enrollmentData?.approverSelfieSkipRequestedAt,
                  approverSelfieSkipRejectedComment:
                    enrollmentData?.approverSelfieSkipRejectedComment,
                  biometricRefreshStatus:
                    enrollmentData?.biometricRefreshStatus,
                },
              ]
            : []
        }
        data-testid="table"
      >
        <Column resizable minWidth={20}>
          <HeaderCell>{translation.photo}</HeaderCell>
          <ImageCell dataKey="photo" name={["firstName", "lastName"]} />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.surname}</HeaderCell>
          <CompactCell dataKey="firstName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.post_name}</HeaderCell>
          <CompactCell dataKey="lastName" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.email}</HeaderCell>
          <CompactCell dataKey="email" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.phone_number}</HeaderCell>
          <CompactCell dataKey="phoneNumber" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.code}</HeaderCell>
          <CompactCell dataKey="approverSelfieSkipCode" />
        </Column>
        {enrollmentData?.biometricRefreshStatus !== "" ? (
          <Column fullText sortable flexGrow={1} resizable>
            <HeaderCell>{translation.status}</HeaderCell>
            <StatusCell dataKey="biometricRefreshStatus" />
          </Column>
        ) : (
          <Column fullText sortable flexGrow={1} resizable>
            <HeaderCell>{translation.status}</HeaderCell>
            <StatusCell dataKey="approverSelfieSkipStatus" />
          </Column>
        )}

        <Column resizable minWidth={80}>
          <HeaderCell>{translation.action}</HeaderCell>
          <ButtonCell
            dataKey="_id"
            onClick={(rowData) => {
              setOpen(true);
              setSelectedData(rowData);
            }}
          />
        </Column>
      </Table>

      {selectedData && (
        <ViewInfo
          open={open}
          setOpen={setOpen}
          data={selectedData}
          setRefresh={() => fetchData()}
          isPairValidator
          enrollmentId={enrollmentId}
          accountId={accountId}
          type="account"
          isBioRefresh={
            isBioRefresh
              ? isBioRefresh
              : enrollmentData?.biometricRefreshStatus &&
                enrollmentData?.biometricRefreshStatus !== ""
              ? true
              : false
          }
          isStartedOnline={isStartedOnline}
        />
      )}
    </>
  );
}

export default ApproverSkip;
