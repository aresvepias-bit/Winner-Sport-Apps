"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unit?: { symbol: string };
  kind: "MATERIAL" | "PRODUCT";
}

/**
 * Mengambil daftar item yang stoknya <= minimumStock dari /inventory/summary.
 * Gagal fetch dianggap "tidak ada alert" agar UI tidak rusak.
 */
export function useLowStock(enabled = true) {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/inventory/summary");
      const materials: LowStockItem[] = (res?.lowStockMaterials || []).map((m: any) => ({ ...m, kind: "MATERIAL" }));
      const products: LowStockItem[] = (res?.lowStockProducts || []).map((p: any) => ({ ...p, kind: "PRODUCT" }));
      setItems([...materials, ...products]);
    } catch (err) {
      console.warn("Gagal memuat alert stok minimum:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}
