import { FilterContext } from "@/context/FilterContext";
import { useFetchSingleCenter } from "@/hooks/useCenters";
import { getStorage } from "@/utils/storage";
import { useEffect, useState } from "react";
import List from "./list";
import OffDayFilter from "./filters";

function OffDays() {
  const { center, loadingCenter, fetchCenterData } = useFetchSingleCenter();
  const [centerId, setCenterId] = useState("");

  const fetchData = async (filters?: any) => {
    if (!filters) return;

    const userData = await getStorage();
    let centerId = filters?.center?.map((el: any) => el.value) || filters;

    console.log(filters);

    if (
      userData.account &&
      userData.account.center &&
      userData.account.center._id
    ) {
      centerId = userData.account.center._id;
    }

    if (Array.isArray(centerId) && centerId?.length > 0) {
      setCenterId(centerId[0]);
      fetchCenterData(centerId[0]);
    } else if (centerId !== "" && !Array.isArray(centerId)) {
      setCenterId(centerId);
      fetchCenterData(centerId);
    } else {
      setCenterId("");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatOffdays = (data: string[]) => {
    return data.map((el) => {
      return {
        date: el,
      };
    });
  };

  return (
    <div className="row">
      <OffDayFilter
        fetchData={fetchData}
        data={formatOffdays(center?.offdays || [])}
        centerId={centerId}
        offdays={center?.offdays || []}
      />
      {centerId && centerId !== "" && (
        <div>
          <List
            data={formatOffdays(center?.offdays || [])}
            loading={loadingCenter}
            fetchData={fetchData}
            centerId={centerId}
            offdays={center?.offdays || []}
          />
        </div>
      )}
    </div>
  );
}

export default OffDays;
