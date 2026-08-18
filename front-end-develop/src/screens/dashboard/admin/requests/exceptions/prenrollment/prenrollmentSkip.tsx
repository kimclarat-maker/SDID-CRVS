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
import { useFetchPrenrollmentSelfieSkip } from "@/hooks/useFetchSkipSelfie";
import { StatusCell } from "@/components/table/status";
import Button from "@/components/button";
import {
  useFetchPrenrollmentByIdentifier,
  useFetchPrenrollmentByPrenrollmentNo,
} from "@/hooks/useFetchPrenrollment";

const { Column, HeaderCell, Cell } = LibTable;

const CompactCell: React.FC<any> = (props) => {
  const value = get(props.rowData, props.dataKey, "-");
  return (
    <Cell {...props} style={{ padding: 16 }}>
      {value}
    </Cell>
  );
};

function PrenrollmentSkip() {
  const [isStarting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { translation } = useContext(LanguageContext);
  const { prenrollmentNo } = useParams();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<Prenrollment>();

  const { data, loading, fetchPrenrollmentByPrenrollmentNoData } =
    useFetchPrenrollmentByPrenrollmentNo();

  const isStartedOnline = searchParams.get("isStartedOnline") === "true";

  const fetchData = async () => {
    if (!prenrollmentNo) return;

    if (isStartedOnline) {
      await fetchPrenrollmentByPrenrollmentNoData(
        prenrollmentNo,
        false,
        isStartedOnline
      );
      return;
    }
    await fetchPrenrollmentByPrenrollmentNoData(prenrollmentNo, true);
  };

  useEffect(() => {
    fetchData();
  }, [prenrollmentNo]);

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
            <Text data-testid="prenrollmentNo">{prenrollmentNo}</Text>
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

      {(loading || isStarting) && (
        <>
          <center>
            <Loading />
          </center>
          <br />
        </>
      )}

      <Table data={data?._id ? [data] : []} data-testid="table">
        <Column resizable minWidth={20}>
          <HeaderCell>{translation.photo}</HeaderCell>
          <ImageCell dataKey="selfie" name={["firstName", "lastName"]} />
        </Column>
        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.prenrollment_number}</HeaderCell>
          <CompactCell dataKey="preEnrollmentNumber" />
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
          <HeaderCell>{translation.code}</HeaderCell>
          <CompactCell dataKey="selfieVerificationSkipCode" />
        </Column>

        <Column fullText sortable flexGrow={1} resizable>
          <HeaderCell>{translation.status}</HeaderCell>
          <StatusCell dataKey="selfieVerificationSkipStatus" />
        </Column>

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
          preEnrollmentId={selectedData._id}
          open={open}
          setOpen={setOpen}
          data={selectedData}
          setRefresh={() => fetchData()}
          isStartedOnline={isStartedOnline}
        />
      )}
    </>
  );
}

export default PrenrollmentSkip;
