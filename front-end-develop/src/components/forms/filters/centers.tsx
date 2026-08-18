import SelectDropdown from "@/components/select";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchCenters } from "@/hooks/useCenters";
import React, { useContext, useEffect } from "react";

type FormTypes = {
  errors: any;
  values: any;
  setFieldValue: any;
};

const Centers: React.FC<FormTypes> = ({ errors, values, setFieldValue }) => {
  const { translation } = useContext(LanguageContext);
  const { loadingCenters, centers, fetchCentersData } =
    useFetchCenters("dropdown");

  useEffect(() => {
    fetchCentersData({
      offset: 0,
      limit: 100,
      search: "",
    });
  }, []);
  return (
    <>
      <SelectDropdown
        name="center"
        testId="center"
        label={translation.center}
        value={values.center}
        onChange={(e) => setFieldValue("center", e)}
        options={centers}
        loading={loadingCenters}
        error={errors.center}
      />
    </>
  );
};

export default Centers;
