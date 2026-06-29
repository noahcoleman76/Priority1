import { useCallback, useEffect, useState } from "react";
import type { AppDataDto } from "@priority1/shared";
import { api } from "../../api/client";

export const useAppData = () => {
  const [data, setData] = useState<AppDataDto>({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const result = await api.appData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
};
