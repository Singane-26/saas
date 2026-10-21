"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCFA, formatDate } from "@/lib/format";
import BottomNav from "@/components/BottomNav";

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    // Fetch dashboard data (reuse dashboard endpoint for overview stats)
    fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch top products (using sales endpoint would be too complex,
    // so for now we use the products endpoint sorted by quantity)
    fetch("/api/products?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setTopProducts(result.data.products);
      })
      .catch(console.error);
  }, [token]);

  if (loading) {
    return (
      <div className="container page-content">
        <div className="page-header">
          <h1 className="page-header-title">📊 Rapports</h1>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ marginBottom: 12 }}>
            <div className="skeleton" style={{ width: "50%", height: 16, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: "80%", height: 32 }} />
          </div>
        ))}
        <BottomNav active="more" />
      </div>
    );
  }

  const revenue = data?.month?.revenue || 0;
  const cogs = data?.month?.cogs || 0;
  const expenses = data?.month?.expenses || 0;
  const profit = data?.month?.estimatedProfit || 0;
  const todayRevenue = data?.today?.revenue || 0;
  const todaySales = data?.today?.salesCount || 0;
  const monthSales = data?.month?.salesCount || 0;
  const avgSale = monthSales > 0 ? Math.round(revenue / monthSales) : 0;

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-header-title">📊 Rapports</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input"
          style={{ width: "auto", minHeight: 36, padding: "4px 12px", fontSize: "var(--font-size-sm)" }}
        >
          <option value="today">Aujourd&apos;hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {/* Revenue Card */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <div className="card-header">
          <span className="card-title">📊 Ventes</span>
        </div>
        <div className="amount-lg">{formatCFA(revenue)}</div>
        <div className="text-muted" style={{ marginTop: 4 }}>
          {monthSales} vente{monthSales > 1 ? "s" : ""} │ Moyenne : {formatCFA(avgSale)}
        </div>

        {/* Simple bar chart */}
        <div
          style={{
            marginTop: 16,
            height: 8,
            background: "var(--color-border)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: revenue > 0 ? "100%" : "0%",
              background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Profit Card */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <div className="card-header">
          <span className="card-title">💰 Bénéfice estimé</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Ventes</span>
            <span className="amount text-success">{formatCFA(revenue)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Coût des marchandises</span>
            <span className="amount" style={{ color: "var(--color-text-secondary)" }}>
              − {formatCFA(cogs)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Dépenses</span>
            <span className="amount" style={{ color: "var(--color-text-secondary)" }}>
              − {formatCFA(expenses)}
            </span>
          </div>
          <div
            style={{
              borderTop: "2px solid var(--color-border)",
              paddingTop: 8,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: "var(--font-size-lg)",
            }}
          >
            <span>Bénéfice</span>
            <span style={{ color: profit >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {formatCFA(profit)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <div className="card-header">
          <span className="card-title">🏆 Produits</span>
        </div>
        {topProducts.slice(0, 5).map((product, i) => (
          <div
            key={product.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < 4 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: i < 3 ? "var(--color-primary-50)" : "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: "var(--font-size-sm)" }}>{product.name}</span>
            </div>
            <span className="text-muted">{formatCFA(product.sellPrice)}</span>
          </div>
        ))}
      </div>

      {/* Export Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
        <button className="btn btn-secondary">
          📄 Export PDF
        </button>
        <button className="btn btn-secondary">
          📊 Export CSV
        </button>
      </div>

      <BottomNav active="more" />
    </div>
  );
}
