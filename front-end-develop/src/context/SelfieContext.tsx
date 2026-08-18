import { createContext, useState, ReactNode, useContext } from "react";

export interface SelfieContextType {
  selfieImage: string | null;
  setSelfieImage: (image: string | null) => void;
  lastMessageType: string | null;
  setLastMessageType: (type: string | null) => void;
  resetSelfieImage: () => void;
  originalImage: string | null;
  setOriginalImage: (image: string | null) => void;
  setIsForceCapture: (isForceCapture: boolean) => void;
  isForceCapture: boolean;
  setIcaoAttributes: (attr: any) => void;
  icaoAttributes: any;
}

export const SelfieContext = createContext<SelfieContextType>({
  selfieImage: null,
  setSelfieImage: () => {},
  lastMessageType: null,
  setLastMessageType: () => {},
  resetSelfieImage: () => {},
  setOriginalImage: () => {},
  originalImage: null,
  setIsForceCapture: () => {},
  isForceCapture: false,
  setIcaoAttributes: () => {},
  icaoAttributes: null,
});

export const SelfieProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [lastMessageType, setLastMessageType] = useState<string | null>(null);
  const [icaoAttributes, setIcaoAttributes] = useState<string | null>(null);

  return (
    <SelfieContext.Provider
      value={{
        selfieImage,
        setSelfieImage,
        lastMessageType,
        setLastMessageType,
        resetSelfieImage: () => setSelfieImage(null),
        originalImage,
        setOriginalImage,
        setIsForceCapture: () => {},
        isForceCapture: false,
        setIcaoAttributes,
        icaoAttributes,
      }}
    >
      {children}
    </SelfieContext.Provider>
  );
};

// Custom hook for easier usage
export const useSelfie = () => {
  const context = useContext(SelfieContext);
  if (!context) {
    throw new Error("useSelfie must be used within a SelfieProvider");
  }
  return context;
};
