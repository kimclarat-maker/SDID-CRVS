import Header from "@/components/header";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";

function CenterInfo({ data }: { data: any }) {
  const { translation } = useContext(LanguageContext);
  return (
    <Header
      containerStyles={{
        flexDirection: "column",
        alignItems: "flex-start",
      }}
      title={data.name}
      tags={[
        {
          name: translation.capacity,
          value: data.capacity,
        },
        {
          name: data.province,
          value: data.province,
        },
        {
          name: translation.district,
          value: data.district,
        },
        {
          name: translation.sector,
          value: data.sector,
        },
        {
          name: translation.cell,
          value: data.cell,
        },
      ]}
    />
  );
}

export default CenterInfo;
