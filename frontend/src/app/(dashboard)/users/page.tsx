"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/session";
import ErrorBanner from "@/components/common/ErrorBanner";
import UsersHeader from "@/components/users/UsersHeader";
import UsersNavTabs, { UsersTabType } from "@/components/users/UsersNavTabs";
import UsersTable from "@/components/users/UsersTable";
import UserFormModal from "@/components/users/UserFormModal";
import ResetPasswordModal from "@/components/users/ResetPasswordModal";
import PermissionMatrix, { PermissionData } from "@/components/users/PermissionMatrix";
import LoginAuditTable, { LoginAuditEntry, LoginAuditSummary } from "@/components/users/LoginAuditTable";
import type { AppUser } from "@/components/users/userRoles";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; user: AppUser }
  | { kind: "reset"; user: AppUser }
  | null;

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UsersTabType>("accounts");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<PermissionData | null>(null);
  const [audit, setAudit] = useState<{ entries: LoginAuditEntry[]; summary?: LoginAuditSummary; retentionDays?: number } | null>(null);
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const me = getStoredUser();
  const isOwner = me?.role === "OWNER";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      if (activeTab === "accounts") {
        const res = await api.get("/users");
        setUsers(Array.isArray(res) ? res : []);
      } else if (activeTab === "permissions") {
        setPermissions(await api.get("/users/permissions"));
      } else {
        setAudit(await api.get(`/users/login-audit?limit=200&onlyFailed=${onlyFailed}`));
      }
    } catch (err: any) {
      setLoadError(err.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, onlyFailed]);

  useEffect(() => {
    load();
  }, [load]);

  // ADMIN tidak boleh menyentuh akun OWNER (backend juga menolaknya).
  const canManage = (user: AppUser) => isOwner || user.role !== "OWNER";

  const handleSubmitUser = async (data: Record<string, unknown>) => {
    try {
      if (modal?.kind === "edit") {
        await api.put(`/users/${modal.user.id}`, data);
        alert("Data akun berhasil diperbarui.");
      } else {
        await api.post("/users", data);
        alert("Akun baru berhasil dibuat.");
      }
      setModal(null);
      load();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan akun. Data belum tersimpan.");
    }
  };

  const handleResetPassword = async (password: string) => {
    if (modal?.kind !== "reset") return;
    try {
      await api.post(`/users/${modal.user.id}/reset-password`, { password });
      alert("Password akun berhasil diganti.");
      setModal(null);
    } catch (err: any) {
      alert(err.message || "Gagal mengganti password.");
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    const menonaktifkan = user.isActive;
    const konfirmasi = menonaktifkan
      ? `Nonaktifkan akun "${user.name}"? Akun ini tidak akan bisa login, tetapi riwayat transaksinya tetap tersimpan.`
      : `Aktifkan kembali akun "${user.name}"?`;
    if (!confirm(konfirmasi)) return;

    try {
      if (menonaktifkan) await api.delete(`/users/${user.id}`);
      else await api.put(`/users/${user.id}`, { isActive: true });
      alert(menonaktifkan ? "Akun dinonaktifkan." : "Akun diaktifkan kembali.");
      load();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status akun.");
    }
  };

  const handleSavePermissions = async (changes: Array<{ role: string; module: string; allowed: boolean }>) => {
    try {
      const res = await api.put("/users/permissions", { changes });
      setPermissions((prev) => (prev ? { ...prev, matrix: res.matrix } : prev));
      alert(res.message || "Hak akses diperbarui.");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan hak akses. Perubahan belum tersimpan.");
    }
  };

  return (
    <div className="space-y-6">
      <UsersHeader
        loading={loading}
        onRefresh={load}
        onCreate={activeTab === "accounts" ? () => setModal({ kind: "create" }) : undefined}
      />

      <ErrorBanner message={loadError} onRetry={load} />

      <UsersNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "accounts" && (
        <UsersTable
          users={users}
          currentUserId={me?.id}
          canManage={canManage}
          onEdit={(user) => setModal({ kind: "edit", user })}
          onResetPassword={(user) => setModal({ kind: "reset", user })}
          onToggleActive={handleToggleActive}
        />
      )}

      {activeTab === "permissions" && permissions && (
        <PermissionMatrix data={permissions} currentRole={me?.role} onSave={handleSavePermissions} />
      )}

      {activeTab === "audit" && audit && (
        <LoginAuditTable
          entries={audit.entries || []}
          summary={audit.summary}
          retentionDays={audit.retentionDays}
          onlyFailed={onlyFailed}
          onToggleFilter={setOnlyFailed}
        />
      )}

      {(modal?.kind === "create" || modal?.kind === "edit") && (
        <UserFormModal
          user={modal.kind === "edit" ? modal.user : null}
          canAssignOwner={isOwner}
          isSelf={modal.kind === "edit" && modal.user.id === me?.id}
          onClose={() => setModal(null)}
          onSubmit={handleSubmitUser}
        />
      )}

      {modal?.kind === "reset" && (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} onSubmit={handleResetPassword} />
      )}
    </div>
  );
}
