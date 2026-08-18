import Input from "@/components/input";
import Select from "@/components/select";
import React, { useContext, useState } from "react";
import { format } from "date-fns";
import Card from "@/components/card";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";

interface Props {
  fetchData: () => void;
  loading: boolean;
  setFromHour: (t: number) => void;
  fromHour: number;
  toHour: number;
  setToHour: (t: number) => void;
  selectedDate: string;
  setSelectedDate: (t: string) => void;
}

const Filters: React.FC<Props> = ({
  fetchData,
  loading,
  setFromHour,
  fromHour,
  toHour,
  setToHour,
  selectedDate,
  setSelectedDate
}) => {
  const { translation } = useContext(LanguageContext);

  const hours = () => {
    return [...Array(17)].map((_, i) => {
      const hour = 7 + i;
      return {
        label: `${hour}:00`,
        value: hour
      };
    });
  };

  const hourOptions = hours();

  const selectedFrom = hourOptions.find((o) => o.value === fromHour) || null;
  const selectedTo = hourOptions.find((o) => o.value === toHour) || null;

  return (
    <Card>
      <div className="row">
        <div className="col-4">
          <Input
            name="date"
            type="date"
            value={selectedDate}
            onChange={setSelectedDate}
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        <div className="col-4">
          <Select
            options={hours()}
            name="fromHour"
            value={selectedFrom}
            onChange={setFromHour}
            placeholder="From Hour"
          />
        </div>
        <div className="col-4">
          <Select
            options={hours()}
            name="toHour"
            value={selectedTo}
            onChange={setToHour}
            placeholder="To Hour"
          />
        </div>
      </div>
      <Button text={translation.search} onClick={fetchData} loading={loading} />
    </Card>
  );
};

export default Filters;
