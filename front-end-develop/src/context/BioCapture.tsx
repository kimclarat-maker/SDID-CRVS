import { createContext, useState } from "react";

interface BioDataType {
  data: any;
  setBioData: (e: any) => void;
}
// Create context with default values
export const BioDataContext = createContext<BioDataType>({
  data: {},
  setBioData: () => {},
});

export const BioCaptureProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Initialize state with default filters
  const [data, setBioData] = useState({});

  return (
    <BioDataContext.Provider value={{ data, setBioData }}>
      {children}
    </BioDataContext.Provider>
  );
};
