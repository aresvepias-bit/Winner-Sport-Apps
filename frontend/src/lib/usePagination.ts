"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Pagination di sisi klien untuk tabel daftar.
 * `resetKey` (mis. gabungan nilai search + filter) mengembalikan ke halaman 1 saat berubah.
 */
export function usePagination<T>(items: T[] | undefined | null, pageSize = 10, resetKey: string = "") {
  const list = items ?? [];
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Data bisa menyusut (hapus/refresh): jaga halaman tetap valid.
  const current = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => list.slice((current - 1) * pageSize, current * pageSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, current, pageSize]
  );

  return { page: current, setPage, totalPages, total, pageSize, pageItems };
}
