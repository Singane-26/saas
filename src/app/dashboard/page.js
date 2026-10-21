"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCFA } from "@/lib/format";
import BottomNav from "@/components/BottomNav";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    const storedOrg = localStorage.getItem("organization");
    if (storedOrg) setOrg(JSON.parse(storedOrg));

    // Fetch dashboard data
    fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const today = new Date().toLocaleDateString("fr-SN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="container page-content">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 14 }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto 8px" }} />
              <div className="skeleton" style={{ width: "80%", height: 12, margin: "0 auto" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "var(--font-size-lg)" }}>
            🏪 {org?.name || "Ma Boutique"}
          </h1>
          <p className="text-muted">{today}</p>
        </div>
        <button
          className="btn-icon"
          style={{
            background: "var(--color-primary-50)",
            color: "var(--color-primary)",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            position: "relative",
          }}
          aria-label="Notifications"
        >
          🔔
          {data?.alerts &&
            (data.alerts.lowStockProducts + data.alerts.pendingOrders + data.alerts.customersWithDebt) > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--color-danger)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {data.alerts.lowStockProducts + data.alerts.pendingOrders + data.alerts.customersWithDebt}
              </span>
            )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid animate-fade-in">
        <div className="stat-card">
          <div className="stat-value">{formatCFA(data?.today?.revenue || 0)}</div>
          <div className="stat-label">Aujourd&apos;hui</div>
          <div className="stat-trend">
            {data?.today?.salesCount || 0} vente{(data?.today?.salesCount || 0) > 1 ? "s" : ""}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{formatCFA(data?.month?.revenue || 0)}</div>
          <div className="stat-label">Ce mois</div>
          <div className="stat-trend">
            {data?.month?.salesCount || 0} vente{(data?.month?.salesCount || 0) > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Estimated Profit */}
      <div className="card animate-fade-in" style={{ marginBottom: "var(--space-md)" }}>
        <div className="card-header">
          <span className="card-title">💰 Bénéfice estimé (mois)</span>
        </div>
        <div
          className="amount-lg"
          style={{ color: (data?.month?.estimatedProfit || 0) >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
        >
          {formatCFA(data?.month?.estimatedProfit || 0)}
        </div>
        <div className="text-muted" style={{ marginTop: 4 }}>
          Ventes {formatCFA(data?.month?.revenue || 0)} − Achats {formatCFA(data?.month?.cogs || 0)} − Dépenses{" "}
          {formatCFA(data?.month?.expenses || 0)}
        </div>
      </div>

      {/* Alerts */}
      {data?.alerts && (
        <div className="card animate-fade-in" style={{ marginBottom: "var(--space-md)" }}>
          <div className="card-header">
            <span className="card-title">⚠️ Alertes</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.alerts.lowStockProducts > 0 && (
              <div
                onClick={() => router.push("/products?stockAlert=true")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "#FFF3E0",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                📦{" "}
                <span>
                  <strong>{data.alerts.lowStockProducts}</strong> produit
                  {data.alerts.lowStockProducts > 1 ? "s" : ""} en stock bas
                </span>
              </div>
            )}
            {data.alerts.customersWithDebt > 0 && (
              <div
                onClick={() => router.push("/customers?withDebt=true")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--color-danger-light)",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                💳{" "}
                <span>
                  <strong>{data.alerts.customersWithDebt}</strong> client
                  {data.alerts.customersWithDebt > 1 ? "s" : ""} avec des dettes
                </span>
              </div>
            )}
            {data.alerts.pendingOrders > 0 && (
              <div
                onClick={() => router.push("/orders")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "#E3F2FD",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                📩{" "}
                <span>
                  <strong>{data.alerts.pendingOrders}</strong> commande
                  {data.alerts.pendingOrders > 1 ? "s" : ""} en attente
                </span>
              </div>
            )}
            {data.alerts.lowStockProducts === 0 &&
              data.alerts.customersWithDebt === 0 &&
              data.alerts.pendingOrders === 0 && (
                <p className="text-muted" style={{ textAlign: "center", padding: 8 }}>
                  ✅ Tout est en ordre !
                </p>
              )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-sm)" }}>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/sale")}
          style={{
            flexDirection: "column",
            gap: 4,
            padding: "16px 8px",
          }}
        >
          <span style={{ fontSize: 24 }}>🛒</span>
          <span style={{ fontSize: "var(--font-size-xs)" }}>Vendre</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => router.push("/products")}
          style={{
            flexDirection: "column",
            gap: 4,
            padding: "16px 8px",
          }}
        >
          <span style={{ fontSize: 24 }}>➕</span>
          <span style={{ fontSize: "var(--font-size-xs)" }}>Produit</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => router.push("/reports")}
          style={{
            flexDirection: "column",
            gap: 4,
            padding: "16px 8px",
          }}
        >
          <span style={{ fontSize: 24 }}>📊</span>
          <span style={{ fontSize: "var(--font-size-xs)" }}>Rapports</span>
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
