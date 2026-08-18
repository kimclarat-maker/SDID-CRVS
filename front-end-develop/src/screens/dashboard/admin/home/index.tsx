import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import Header from "@/components/header";
import Filters from "./filters";
import { useParams } from "react-router-dom";
import Enrolled from "./enrolled";
import All from "./all";
import RollBacks from "./rollBacks";
import MissedAppointment from "./missedAppointment";
import moment from "moment";

function Home() {
  const { translation } = useContext(LanguageContext);
  const { page = "home" } = useParams();
  const [filters, setFilters] = useState({
    startDate: moment().subtract(1, "month").format("YYYY-MM-DD HH:mm"),
    endDate: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
  });

  return (
    <>
      <div data-testid="filters">
        <Filters filters={filters} setFilters={setFilters} />
      </div>

      <br />
      <div data-testid="content">
        {page === "enrolled" ? (
          <Enrolled filters={filters} />
        ) : page === "rollBacks" ? (
          <RollBacks filters={filters} />
        ) : page === "missedAppointment" ? (
          <MissedAppointment filters={filters} />
        ) : (
          <All filters={filters} />
        )}
      </div>
    </>
  );
}

export default Home;
