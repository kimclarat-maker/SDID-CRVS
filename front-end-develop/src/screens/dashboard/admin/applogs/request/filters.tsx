import Filters from "@/components/filters";
import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { Stack } from "rsuite";
import Button from "@/components/button";
import StackItem from "rsuite/esm/Stack/StackItem";
import Card from "@/components/card";
import Input from "@/components/input";

function LogsFilters({
  loading,
  setFilters,
  filters,
}: {
  loading?: boolean;
  setFilters: (e: any) => void;
  filters: any;
}) {
  const { translation } = useContext(LanguageContext);
  const [identifier, setNIDValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);

    setNIDValue(filters.identifier);
  }, [filters]);

  return (
    <div className="mb-3">
      <Card>
        <div>
          <Filters sections={[<Stack.Item grow={1} />]} />
        </div>
        <div>
          <Stack>
            <StackItem grow={1}>
              <div className="row mb-3">
                <div className="col-md-4">
                  <Input
                    name="identifier"
                    placeholder={`${translation.search} ${translation.identifier}...`}
                    onChange={(e) => setNIDValue(e)}
                    value={identifier}
                    label={translation.id_number}
                    leftIcon="person"
                  />
                </div>
                <div className="col-md-4">
                  <Input
                    name="startDate"
                    placeholder={`${translation.search} ${translation.start_date}...`}
                    onChange={(e) => setStartDate(e)}
                    value={startDate}
                    type="date"
                    label={translation.start_date}
                  />
                </div>
                <div className="col-md-4">
                  <Input
                    name="endDate"
                    placeholder={`${translation.search} ${translation.start_date}...`}
                    onChange={(e) => setEndDate(e)}
                    value={endDate}
                    type="date"
                    label={translation.end_date}
                  />
                </div>
              </div>
              <div>
                <Button
                  text={translation.search}
                  onClick={() =>
                    setFilters({
                      identifier,
                      startDate,
                      endDate,
                    })
                  }
                  loading={loading}
                />
              </div>
            </StackItem>
            <StackItem grow={1} />
          </Stack>
        </div>
      </Card>
    </div>
  );
}

export default LogsFilters;
