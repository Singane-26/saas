"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCFA, formatPhone, whatsappLink } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/Toast";

export default function CustomersPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debtOnly, setDebtOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (debtOnly) params.set("withDebt", "true");

    fetch(`/api/customers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCustomers(data.data.customers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, debtOnly, token]);

  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "+221", address: "" });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Client ajouté ✅", "success");
        setShowAddForm(false);
        setNewCustomer({ fullName: "", phone: "+221", address: "" });
        setSearch((s) => s + " ");
        setTimeout(() => setSearch((s) => s.trim()), 100);
      } else {
        showToast(data.message || "Erreur", "danger");
      }
    } catch {
      showToast("Erreur de connexion", "danger");
    }
  };

  // Check URL params for debt filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("withDebt") === "true") setDebtOnly(true);
  }, []);

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-header-title">👥 Clients</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Fermer" : "➕ Nouveau"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustomer}
          className="card animate-slide-up"
          style={{ marginBottom: "var(--space-md)" }}
        >
          <h3 style={{ marginBottom: "var(--space-md)" }}>Nouveau client</h3>
          <div className="input-group">
            <label className="input-label">Nom complet *</label>
            <input
              className="input"
              type="text"
              placeholder="Moussa Diop"
              value={newCustomer.fullName}
              onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Téléphone</label>
            <input
              className="input"
              type="tel"
              placeholder="+221 77 123 45 67"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Adresse</label>
            <input
              className="input"
              type="text"
              placeholder="Parcelles Assainies, Dakar"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            ✅ Enregistrer
          </button>
        </form>
      )}

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-md)" }}>
        <div className="input-with-icon" style={{ flex: 1 }}>
          <span className="input-icon">🔍</span>
          <input
            className="input"
            type="search"
            placeholder="Chercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-sm ${debtOnly ? "btn-danger" : "btn-secondary"}`}
          onClick={() => setDebtOnly(!debtOnly)}
          style={{ whiteSpace: "nowrap" }}
        >
          💳 Dettes
        </button>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="product-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="product-item">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "40%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="product-list">
          {customers.map((customer) => (
            <div key={customer.id} className="product-item">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: customer.balanceDue > 0 ? "var(--color-danger-light)" : "var(--color-primary-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                👤
              </div>
              <div className="product-info">
                <div className="product-name">{customer.fullName}</div>
                <div className="product-meta">
                  {customer.phone ? formatPhone(customer.phone) : "Pas de téléphone"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {customer.balanceDue > 0 && (
                  <div style={{ fontWeight: 700, color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>
                    {formatCFA(customer.balanceDue)}
                  </div>
                )}
                {customer.phone && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <a
                      href={`tel:${customer.phone}`}
                      style={{ fontSize: 18 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞
                    </a>
                    <a
                      href={whatsappLink(
                        customer.phone,
                        customer.balanceDue > 0
                          ? `Bonjour ${customer.fullName}, un rappel pour votre solde de ${formatCFA(customer.balanceDue)}. Merci !`
                          : ""
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 18 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📱
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              {search ? `Aucun client trouvé pour "${search}"` : "Aucun client. Ajoutez-en un !"}
            </p>
          )}
        </div>
      )}

      {ToastComponent}
      <BottomNav active="customers" />
    </div>
  );
}
