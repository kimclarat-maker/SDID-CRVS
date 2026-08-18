import { useContext, useState } from "react";
import { LanguageContext } from "@/context/LanguageContext";
import { Input, Stack } from "rsuite";
import { FilterContext } from "@/context/FilterContext";
import Button from "@/components/button";
import StackItem from "rsuite/esm/Stack/StackItem";

function ErrorFilters({ loading }: { loading: boolean }) {
  const { translation } = useContext(LanguageContext);
  const { setFilters } = useContext(FilterContext);
  const [errorCode, setErrorCode] = useState("");

  const handleFilter = () => {
    setFilters((prev: any) => ({
      ...prev,
      errorCode,
    }));
  };

  return (
    <Stack spacing={16} className="mb-3">
      <StackItem>
        <Input
          name="errorCode"
          placeholder="ErrorCode"
          value={errorCode}
          onChange={(e) => setErrorCode(e)}
        />
      </StackItem>
      <StackItem>
        <Button
          text={translation.search}
          startIcon="search"
          onClick={() => handleFilter()}
          loading={loading}
          disabled={loading}
        />
      </StackItem>
    </Stack>
  );
}

export default ErrorFilters;
