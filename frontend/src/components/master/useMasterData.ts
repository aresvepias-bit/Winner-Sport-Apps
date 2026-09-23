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

/**
 * Memuat data tab yang sedang aktif.
 *
 * Selama belum ada menu yang dipilih (`activeTab` null) tidak ada permintaan
 * yang dikirim: membuka halaman master tidak lagi otomatis menarik seluruh
 * daftar bahan baku dari server.
 */
export function useMasterData(activeTab: MasterEntity | null) {
  const [data, setData] = useState<MasterData>({
    materials: [], products: [], boms: [], contacts: [], employees: [], units: [], salesTypes: []
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!activeTab) return;
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
