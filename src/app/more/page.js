"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const menuItems = [
  { icon: "📩", label: "Commandes en ligne", path: "/orders", badge: null },
  { icon: "🌐", label: "Catalogue public", path: "/catalog-settings", badge: null },
  { icon: "💸", label: "Dépenses", path: "/expenses", badge: null },
  { icon: "📊", label: "Rapports", path: "/reports", badge: null },
  { icon: "👥", label: "Employés", path: "/employees", badge: null },
  { icon: "💳", label: "Abonnement", path: "/subscription", badge: null },
  { icon: "⚙️", label: "Paramètres", path: "/settings", badge: null },
];

export default function MorePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("organization");
    router.push("/");
  };

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-header-title">⚙️ Plus</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px",
              background: "var(--color-surface)",
              border: "none",
              borderBottom: "1px solid var(--color-border)",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              fontSize: "var(--font-size-base)",
              transition: "background 0.15s ease",
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
            <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>→</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="btn btn-full"
        style={{
          marginTop: "var(--space-xl)",
          background: "var(--color-danger-light)",
          color: "var(--color-danger)",
          fontWeight: 600,
        }}
      >
        🚪 Se déconnecter
      </button>

      <p
        className="text-muted"
        style={{ textAlign: "center", marginTop: "var(--space-lg)", fontSize: "var(--font-size-xs)" }}
      >
        JangiBoutik v0.1.0 — Fait avec ❤️ au Sénégal
      </p>

      <BottomNav active="more" />
    </div>
  );
}
