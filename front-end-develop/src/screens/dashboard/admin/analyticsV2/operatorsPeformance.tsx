import { getOperatorProductivity } from "@/api/analytics";
import SelectDropdown from "@/components/select";
import toastMessage from "@/utils/common/toastMessage";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { format } from "date-fns";
import Input from "@/components/input";
import { TagGroup, Tag, Stack } from "rsuite";
import { LanguageContext } from "@/context/LanguageContext";
import Button from "@/components/button";
import OperatorList from "./operatorsList";
import debounce from "lodash.debounce";
import useExportData from "@/hooks/useExport";

interface Props {
  fromHour: number;
  toHour: number;
  selectedDate: string;
}

interface DataProps {
  total_operators: number;
  total_records: number;
  operators: any[];
}

const OperatorPerformance: React.FC<Props> = ({
  fromHour,
  toHour,
  selectedDate,
}) => {
  const [fromUpdatedHour, setUpdateFromdHour] = useState<any>(fromHour);
  const [toUpdatedHour, setUpdatedToHour] = useState<any>(toHour);
  const [updatedSelectedDate, setUpdatedSelectedDate] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataProps>({} as DataProps);
  const { translation } = useContext(LanguageContext);
  const [query, setQuery] = useState("");
  const { exporting, exportData } = useExportData();

  const hours = () => {
    return [...Array(13)].map((_, i) => {
      const hour = 7 + i;
      return {
        label: `${hour}:00`,
        value: hour,
      };
    });
  };

  const onFetchData = async () => {
    try {
      setLoading(true);
      const res = await getOperatorProductivity(
        selectedDate,
        "pre_enrollment",
        null,
        fromUpdatedHour,
        toUpdatedHour
      );
      setData(res);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      toastMessage("error", error);
    }
  };

  useEffect(() => {
    setUpdatedSelectedDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fromHour && toHour && selectedDate && onFetchData();
  }, [fromHour, toHour, selectedDate]);

  // debounce the input change
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQuery(value);
    }, 300),
    []
  );

  const handleChange = (e: string) => {
    debouncedSearch(e);
  };

  const filteredRecords = useMemo(() => {
    if (!query) return data?.operators;
    return data?.operators?.filter(
      (item) =>
        item.first_name.toLowerCase().includes(query.toLowerCase()) ||
        item.last_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, data?.operators]);

  const formateData = () => {
    return filteredRecords.map((el: any) => {
      return {
        name: el.first_name + " " + el.last_name,
        id_number: el.operator_id,
        count: el.count,
        district: el.district,
        sector: el?.sector,
        cell: el?.cell,
        village: el?.village,
      };
    });
  };

  return (
    <div>
      <div className="row">
        <div className="col-4">
          <Input
            name="date"
            type="date"
            value={updatedSelectedDate}
            onChange={setUpdatedSelectedDate}
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        <div className="col-4">
          <SelectDropdown
            options={hours()}
            name="fromUpdatedHour"
            value={fromUpdatedHour}
            onChange={setUpdateFromdHour}
            placeholder="From Hour"
          />
        </div>
        <div className="col-4">
          <SelectDropdown
            options={hours()}
            name="toUpdatedHour"
            value={toUpdatedHour}
            onChange={setUpdatedToHour}
            placeholder="To Hour"
          />
        </div>
        <div>
          <Button
            text={translation.search}
            loading={loading}
            onClick={onFetchData}
          />
        </div>
      </div>
      {loading ? (
        <></>
      ) : (
        <>
          <hr />
          <div>
            <TagGroup>
              <Tag>
                {translation.operator}: {data?.total_operators || 0}
              </Tag>
              <Tag color="green">
                {translation.pre_enrollment}: {data.total_records}
              </Tag>
            </TagGroup>
          </div>
          <hr />
          <Stack spacing={32}>
            {/* <Stack.Item grow={1}>
              <Input
                name="search"
                placeholder={`${translation.search} ${translation.name}...`}
                leftIcon="search"
                value={query}
                onChange={handleChange}
              />
            </Stack.Item> */}
            <Stack.Item>
              <Button
                text={translation.download_operator_performance}
                loading={exporting}
                onClick={() =>
                  exportData({
                    data: formateData(),
                    format: "csv",
                    filename: "Operators Performance",
                  })
                }
                disabled={filteredRecords?.length === 0}
              />
            </Stack.Item>
          </Stack>
          {/* <div style={{ height: "60vh", overflowY: "auto" }}>
            <OperatorList data={filteredRecords || []} />
          </div> */}
        </>
      )}
    </div>
  );
};

export default OperatorPerformance;
