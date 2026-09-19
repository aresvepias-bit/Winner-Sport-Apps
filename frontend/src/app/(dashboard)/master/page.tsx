"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import MasterHeader from "@/components/master/MasterHeader";
import MasterNavTabs, { MasterTabType } from "@/components/master/MasterNavTabs";
import MasterKpiBar from "@/components/master/MasterKpiBar";
import RawMaterialsTable from "@/components/master/RawMaterialsTable";
import ProductsTable from "@/components/master/ProductsTable";
import BomCardsGrid from "@/components/master/BomCardsGrid";
import ContactsTable from "@/components/master/ContactsTable";
import EmployeesTable from "@/components/master/EmployeesTable";
import CreateRawMaterialModal from "@/components/master/CreateRawMaterialModal";
import CreateProductModal from "@/components/master/CreateProductModal";
import CreateContactModal from "@/components/master/CreateContactModal";
import CreateEmployeeModal from "@/components/master/CreateEmployeeModal";
import EditRawMaterialModal from "@/components/master/EditRawMaterialModal";
import EditProductModal from "@/components/master/EditProductModal";
import EditContactModal from "@/components/master/EditContactModal";
import EditEmployeeModal from "@/components/master/EditEmployeeModal";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MasterTabType>("materials");
  const [loading, setLoading] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Create Modal controls
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Edit Modal controls
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "materials") {
        const res = await api.get("/master/raw-materials");
        setMaterials(res || []);
      } else if (activeTab === "products") {
        const res = await api.get("/master/products");
        setProducts(res || []);
      } else if (activeTab === "boms") {
        const res = await api.get("/master/boms");
        setBoms(res || []);
      } else if (activeTab === "contacts") {
        const res = await api.get("/master/contacts");
        setContacts(res || []);
      } else if (activeTab === "employees") {
        const res = await api.get("/master/employees");
        setEmployees(res || []);
      }
    } catch (err) {
      console.warn("Error loading master data, fallback to active data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleOpenCreateModal = () => {
    if (activeTab === "materials") setShowMaterialModal(true);
    else if (activeTab === "products") setShowProductModal(true);
    else if (activeTab === "contacts") setShowContactModal(true);
    else if (activeTab === "employees") setShowEmployeeModal(true);
    else if (activeTab === "boms") {
      alert("Formula BOM dikonfigurasi saat menerbitkan spesifikasi produk pakaian baru.");
    }
  };

  const getCreateButtonText = () => {
    if (activeTab === "materials") return "Tambah Bahan Baku";
    if (activeTab === "products") return "Tambah Produk Pakaian";
    if (activeTab === "contacts") return "Tambah Rekanan";
    if (activeTab === "employees") return "Tambah Tenaga Kerja";
    return "";
  };

  // Create Handlers
  const handleCreateMaterial = async (data: any) => {
    try {
      await api.post("/master/raw-materials", data);
      alert("Bahan Baku Baru Berhasil Ditambahkan!");
      setShowMaterialModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah bahan baku");
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      await api.post("/master/products", data);
      alert("Produk Baru Berhasil Ditambahkan!");
      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah produk");
    }
  };

  const handleCreateContact = async (data: any) => {
    try {
      await api.post("/master/contacts", data);
      alert("Rekanan Baru Berhasil Ditambahkan!");
      setShowContactModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah rekanan");
    }
  };

  const handleCreateEmployee = async (data: any) => {
    try {
      await api.post("/master/employees", data);
      alert("Tenaga Kerja / Karyawan Baru Berhasil Ditambahkan!");
      setShowEmployeeModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah tenaga kerja");
    }
  };

  // Update Handlers
  const handleUpdateMaterial = async (id: string, data: any) => {
    try {
      await api.put(`/master/raw-materials/${id}`, data);
      alert("Data Bahan Baku Berhasil Diperbarui!");
      setEditingMaterial(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui bahan baku");
    }
  };

  const handleUpdateProduct = async (id: string, data: any) => {
    try {
      await api.put(`/master/products/${id}`, data);
      alert("Data Produk Pakaian Berhasil Diperbarui!");
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui produk");
    }
  };

  const handleUpdateContact = async (id: string, data: any) => {
    try {
      await api.put(`/master/contacts/${id}`, data);
      alert("Data Rekanan Berhasil Diperbarui!");
      setEditingContact(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui rekanan");
    }
  };

  const handleUpdateEmployee = async (id: string, data: any) => {
    try {
      await api.put(`/master/employees/${id}`, data);
      alert("Data Tenaga Kerja Berhasil Diperbarui!");
      setEditingEmployee(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui data tenaga kerja");
    }
  };

  // Delete Handlers with safety confirmations
  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/master/raw-materials/${id}`);
      alert("Bahan baku berhasil dihapus!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus bahan baku");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus model pakaian "${name}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/master/products/${id}`);
      alert("Produk pakaian berhasil dihapus!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus produk");
    }
  };

  const handleDeleteBom = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus formula BOM "${name}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/master/boms/${id}`);
      alert("Formula BOM berhasil dihapus!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus formula BOM");
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus rekanan "${name}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/master/contacts/${id}`);
      alert("Kontak rekanan berhasil dihapus!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kontak rekanan");
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tenaga kerja "${name}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/master/employees/${id}`);
      alert("Data tenaga kerja berhasil dihapus!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus tenaga kerja");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with dynamic create button */}
      <MasterHeader
        loading={loading}
        onRefresh={loadData}
        onCreateNew={activeTab !== "boms" ? handleOpenCreateModal : undefined}
        createButtonText={getCreateButtonText()}
      />

      {/* 2. Navigation Tabs */}
      <MasterNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Real-Time KPI Analytics Bar */}
      <MasterKpiBar
        activeTab={activeTab}
        materials={materials}
        products={products}
        boms={boms}
        contacts={contacts}
        employees={employees}
      />

      {/* 4. Domain Tab Views with Edit & Delete Actions */}
      {activeTab === "materials" && (
        <RawMaterialsTable
          materials={materials}
          onEdit={setEditingMaterial}
          onDelete={handleDeleteMaterial}
        />
      )}

      {activeTab === "products" && (
        <ProductsTable
          products={products}
          onEdit={setEditingProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {activeTab === "boms" && (
        <BomCardsGrid
          boms={boms}
          onDelete={handleDeleteBom}
        />
      )}

      {activeTab === "contacts" && (
        <ContactsTable
          contacts={contacts}
          onEdit={setEditingContact}
          onDelete={handleDeleteContact}
        />
      )}

      {activeTab === "employees" && (
        <EmployeesTable
          employees={employees}
          onEdit={setEditingEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      {/* 5. Create Modals */}
      {showMaterialModal && (
        <CreateRawMaterialModal
          onClose={() => setShowMaterialModal(false)}
          onSubmit={handleCreateMaterial}
        />
      )}
      {showProductModal && (
        <CreateProductModal
          onClose={() => setShowProductModal(false)}
          onSubmit={handleCreateProduct}
        />
      )}
      {showContactModal && (
        <CreateContactModal
          onClose={() => setShowContactModal(false)}
          onSubmit={handleCreateContact}
        />
      )}
      {showEmployeeModal && (
        <CreateEmployeeModal
          onClose={() => setShowEmployeeModal(false)}
          onSubmit={handleCreateEmployee}
        />
      )}

      {/* 6. Edit Modals */}
      {editingMaterial && (
        <EditRawMaterialModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSubmit={handleUpdateMaterial}
        />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdateProduct}
        />
      )}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSubmit={handleUpdateContact}
        />
      )}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSubmit={handleUpdateEmployee}
        />
      )}
    </div>
  );
}
