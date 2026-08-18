import { useState, useEffect } from "react";
import axios from "axios";

interface FetchOptions {
  method: string;
  url: string;
  data?: any;
  headers?: any;
}

const useAPI = (options: FetchOptions) => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleData = async () => {
      setLoading(true);
      setError(null);
      try {
        const httpResponse = await axios({
          method: options.method,
          url: options.url,
          data: options.data,
          headers: options.headers || undefined,
        });
        setResponse(httpResponse.data);
      } catch (err) {
        setError("Failed to perform operation");
        console.log("USE API ERROR: ", options);
      }
      setLoading(false);
    };

    handleData();
  }, [options]);

  return { response, loading, error };
};

export default useAPI;
