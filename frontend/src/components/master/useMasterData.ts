"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { MASTER_ENTITIES, type MasterEntity } from "@/components/master/masterEntities";

export interface MasterData {
  materials: any[];
  products: any[];
  boms: any[];
  contacts: any[];
  employees: any[];
  units: any[];
  salesTypes: any[];
}

/** Memuat data tab yang sedang aktif (tab lain dimuat saat dibuka). */
export function useMasterData(activeTab: MasterEntity) {
  const [data, setData] = useState<MasterData>({
    materials: [], products: [], boms: [], contacts: [], employees: [], units: [], salesTypes: []
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(MASTER_ENTITIES[activeTab].path);
      setData((prev) => ({ ...prev, [activeTab]: res || [] }));
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, loadError, load };
}
