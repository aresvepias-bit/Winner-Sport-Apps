"use client";

import { api } from "@/lib/api";
import { MASTER_ENTITIES, type MasterEntity } from "@/components/master/masterEntities";

/**
 * Create / update / delete generik untuk data master. Pesan & endpoint diambil dari MASTER_ENTITIES.
 * `create` dan `update` mengembalikan true bila berhasil (pemanggil menutup modal),
 * sehingga saat gagal modal tetap terbuka dan isian tidak hilang.
 */
export function useMasterCrud(reload: () => void) {
  const create = async (entity: MasterEntity, data: any): Promise<boolean> => {
    const cfg = MASTER_ENTITIES[entity];
    try {
      await api.post(cfg.path, data);
      alert(cfg.created);
      reload();
      return true;
    } catch (err: any) {
      alert(err.message || cfg.createFail);
      return false;
    }
  };

  const update = async (entity: MasterEntity, id: string, data: any): Promise<boolean> => {
    const cfg = MASTER_ENTITIES[entity];
    try {
      await api.put(`${cfg.path}/${id}`, data);
      alert(cfg.updated);
      reload();
      return true;
    } catch (err: any) {
      alert(err.message || cfg.updateFail);
      return false;
    }
  };

  const remove = async (entity: MasterEntity, id: string, name: string): Promise<void> => {
    const cfg = MASTER_ENTITIES[entity];
    if (!confirm(cfg.deleteConfirm(name))) return;
    try {
      await api.delete(`${cfg.path}/${id}`);
      alert(cfg.deleted);
      reload();
    } catch (err: any) {
      alert(err.message || cfg.deleteFail);
    }
  };

  return { create, update, remove };
}
