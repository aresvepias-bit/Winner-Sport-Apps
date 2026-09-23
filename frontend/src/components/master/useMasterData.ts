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
 * yang dikirim. Dengan `autoLoad: false` pemanggilan sepenuhnya manual:
 * memilih menu pun belum menarik data, halaman yang memutuskan kapan `load()`
 * dijalankan. Halaman yang memang ingin langsung terisi (mis. daftar Customer
 * dan Supplier) memakai perilaku bawaan.
 */
export function useMasterData(activeTab: MasterEntity | null, options: { autoLoad?: boolean } = {}) {
  const { autoLoad = true } = options;
  const [data, setData] = useState<MasterData>({
    materials: [], products: [], boms: [], contacts: [], employees: [], units: [], salesTypes: []
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [termuat, setTermuat] = useState<Partial<Record<MasterEntity, boolean>>>({});

  const load = useCallback(async () => {
    if (!activeTab) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(MASTER_ENTITIES[activeTab].path);
      setData((prev) => ({ ...prev, [activeTab]: res || [] }));
      setTermuat((prev) => ({ ...prev, [activeTab]: true }));
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  /** Tab yang sedang aktif sudah pernah diambil datanya. */
  const sudahDimuat = activeTab ? !!termuat[activeTab] : false;

  return { data, loading, loadError, load, sudahDimuat };
}
