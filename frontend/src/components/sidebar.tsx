"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scissors,
  Layers,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const allMenuGroups = [
  {
    title: "OVERVIEW & EXECUTIVE",
    roles: ["OWNER", "ADMIN", "ACCOUNTING", "SALES"],
    items: [
      { name: "Cockpit Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Laba Rugi (P&L)", href: "/accounting", icon: TrendingUp },
    ],
  },
  {
    title: "MANUFAKTUR & PRODUKSI",
    roles: ["OWNER", "ADMIN", "PRODUKSI", "GUDANG"],
    items: [
      { name: "SPK (Work Order)", href: "/production", icon: Scissors, badge: "PROD", badgeColor: "bg-blue-600 text-white" },
    ],
  },
  {
    title: "PENJUALAN & ORDER",
    roles: ["OWNER", "ADMIN", "SALES", "ACCOUNTING"],
    items: [
      { name: "Order Penjualan", href: "/sales", icon: ShoppingCart },
    ],
  },
  {
    title: "LOGISTIK & INVENTORI",
    roles: ["OWNER", "ADMIN", "GUDANG", "PRODUKSI"],
    items: [
      { name: "Persediaan & Stok", href: "/inventory", icon: Package },
      { name: "Order Bahan (PO)", href: "/purchasing", icon: Truck },
    ],
  },
  {
    title: "MASTER & KONFIGURASI",
    roles: ["OWNER", "ADMIN", "PRODUKSI"],
    items: [
      { name: "Master Data", href: "/master", icon: Layers },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile, mobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const isActuallyOpen = isMobile ? true : isOpen;

  const [userName, setUserName] = useState("Aris Setiyono");
  const [userRole, setUserRole] = useState("OWNER");
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("winner_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.name) setUserName(u.name);
        if (u.role) setUserRole(u.role);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSwitchRole = (newRole: string) => {
    setUserRole(newRole);
    const saved = localStorage.getItem("winner_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        u.role = newRole;
        localStorage.setItem("winner_user", JSON.stringify(u));
      } catch (e) {}
    }
    setShowRoleSelector(false);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("winner_token");
    localStorage.removeItem("winner_user");
    window.location.href = "/login";
  };

  // Filter menus based on active role
  const filteredMenuGroups = allMenuGroups.filter((g) => g.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-[#0d1424] border-r border-slate-200 dark:border-[#1a2236] flex flex-col z-[50] shadow-xl dark:shadow-2xl transition-all duration-300 text-slate-800 dark:text-slate-200",
        isMobile ? (mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]") : "translate-x-0",
        !isMobile && (isOpen ? "w-64" : "w-20")
      )}
    >
      {/* Brand Header Merah Putih Logo Winner Sport */}
      <div className={cn("p-4 border-b border-slate-100 dark:border-[#1a2236] flex items-center relative", isActuallyOpen ? "justify-between" : "justify-center px-0")}>
        <div className={cn("flex items-center gap-3", !isActuallyOpen && "hidden")}>
          <div className="bg-white p-1 rounded-xl shrink-0 shadow-md shadow-red-500/15 border border-red-100 dark:border-slate-700/50 w-11 h-11 flex items-center justify-center">
            <img src="/logo-emblem.png" alt="Winner Sport Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wide text-slate-900 dark:text-white leading-tight">THE WINNER</h1>
            <span className="text-[10px] text-red-600 dark:text-red-500 font-bold uppercase tracking-wider block">Sport Apparel System</span>
          </div>
        </div>

        {!isActuallyOpen && (
          <div className="bg-white p-1 rounded-xl shrink-0 shadow-md shadow-red-500/15 mb-4 mt-2 border border-red-100 dark:border-slate-700/50 w-10 h-10 flex items-center justify-center">
            <img src="/logo-emblem.png" alt="Winner Sport Logo" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Floating Sidebar Toggle Button (Desktop Only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-6 bg-white dark:bg-[#1a2236] border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-red-600 transition-colors z-50 cursor-pointer"
          >
            {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation Groups filtered by RBAC */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {filteredMenuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {isActuallyOpen ? (
              <p className="px-3.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-[0.15em] uppercase">
                {group.title}
              </p>
            ) : (
              <div className="w-8 border-t border-slate-200 dark:border-[#1a2236] mx-auto mb-3 mt-4" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isMobile) setIsOpen(false);
                    }}
                    title={!isActuallyOpen ? item.name : undefined}
                    className={cn(
                      "flex items-center transition-all duration-200 group relative border",
                      isActuallyOpen ? "justify-between px-3.5 py-2.5 rounded-xl" : "justify-center p-3 rounded-xl mx-2",
                      isActive
                        ? "bg-red-50 dark:bg-red-600/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 font-semibold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 border-transparent hover:text-red-600 dark:hover:text-white hover:bg-red-50/50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-all duration-300 group-hover:scale-110",
                          isActive ? "text-red-600 dark:text-red-400" : "text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400"
                        )}
                      />
                      {isActuallyOpen && <span className="text-xs font-semibold tracking-tight">{item.name}</span>}
                    </div>
                    {isActuallyOpen && item.badge && !isActive && (
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-xs",
                        item.badgeColor
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {isActuallyOpen && isActive && <ChevronRight className="w-3.5 h-3.5 text-red-500 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer GLC Style with RBAC Role Switcher */}
      <div className={cn("border-t border-slate-100 dark:border-[#1a2236] bg-slate-50 dark:bg-[#090e1a] relative", isActuallyOpen ? "p-4 space-y-3" : "p-3 flex flex-col items-center")}>
        {/* Role Selector Popup */}
        {showRoleSelector && isActuallyOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] rounded-2xl p-3 shadow-2xl space-y-2 z-50 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Ganti Peran Hak Akses (RBAC)</span>
            </div>
            <div className="space-y-1">
              {["OWNER", "ADMIN", "PRODUKSI", "GUDANG", "SALES", "ACCOUNTING"].map((r) => (
                <button
                  key={r}
                  onClick={() => handleSwitchRole(r)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-between",
                    userRole === r
                      ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <span>{r}</span>
                  {userRole === r && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div 
          className={cn(
            "flex items-center justify-between w-full p-2 rounded-xl bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-[#1a2236] transition-all duration-200 shadow-2xs", 
            !isActuallyOpen ? "justify-center p-1.5 cursor-pointer hover:border-red-500/50 hover:text-red-500" : "p-2"
          )}
        >
          <div
            onClick={() => isActuallyOpen && setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
            title="Klik untuk ganti Role (RBAC)"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/20 shrink-0">
              {getInitials(userName)}
            </div>
            {isActuallyOpen && (
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-none" title={userName}>{userName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider">{userRole}</span>
                  <span className="text-[9px] text-slate-400">&bull; Ganti</span>
                </div>
              </div>
            )}
          </div>
          {isActuallyOpen && (
            <button
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {isActuallyOpen && (
          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            &copy; 2026 Winner Sport.
          </p>
        )}
      </div>
    </aside>
  );
}
