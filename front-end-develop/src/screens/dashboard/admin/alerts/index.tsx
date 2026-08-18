import CustomTabs from "@/components/tabs";
import ThirtyDaysPlus from "./30Days";
import NinetyDaysPlus from "./90Days";

function Alerts() {
  return (
    <CustomTabs
      options={[
        {
          title: "30 Days+",
          data: <ThirtyDaysPlus />,
        },
        {
          title: "90 Days+",
          data: <NinetyDaysPlus />,
        },
      ]}
    />
  );
}

export default Alerts;
