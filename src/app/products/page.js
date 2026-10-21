"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCFA } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/Toast";

export default function ProductsPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockAlert, setStockAlert] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch products
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stockAlert) params.set("stockAlert", "true");

    fetch(`/api/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, stockAlert, token]);

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    buyPrice: "",
    sellPrice: "",
    quantityInStock: "",
    alertThreshold: "5",
    unit: "pièce",
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          buyPrice: parseInt(newProduct.buyPrice, 10) || 0,
          sellPrice: parseInt(newProduct.sellPrice, 10),
          quantityInStock: parseInt(newProduct.quantityInStock, 10) || 0,
          alertThreshold: parseInt(newProduct.alertThreshold, 10) || 5,
          unit: newProduct.unit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Produit ajouté ✅", "success");
        setShowAddForm(false);
        setNewProduct({ name: "", buyPrice: "", sellPrice: "", quantityInStock: "", alertThreshold: "5", unit: "pièce" });
        // Refresh list
        setSearch((s) => s + " ");
        setTimeout(() => setSearch((s) => s.trim()), 100);
      } else {
        showToast(data.message || "Erreur", "danger");
      }
    } catch {
      showToast("Erreur de connexion", "danger");
    }
  };

  const getStockClass = (product) => {
    if (product.quantityInStock <= 0) return "stock-out";
    if (product.quantityInStock <= product.alertThreshold) return "stock-low";
    return "stock-ok";
  };

  const getStockLabel = (product) => {
    if (product.quantityInStock <= 0) return "Rupture";
    if (product.quantityInStock <= product.alertThreshold) return `${product.quantityInStock} (bas)`;
    return product.quantityInStock;
  };

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-header-title">📦 Produits</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Fermer" : "➕ Ajouter"}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddProduct}
          className="card animate-slide-up"
          style={{ marginBottom: "var(--space-md)" }}
        >
          <h3 style={{ marginBottom: "var(--space-md)" }}>Nouveau produit</h3>

          <div className="input-group">
            <label className="input-label">Nom du produit *</label>
            <input
              className="input"
              type="text"
              placeholder="Ex: Riz brisé 25kg"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
            <div className="input-group">
              <label className="input-label">Prix d&apos;achat (FCFA)</label>
              <input
                className="input"
                type="number"
                placeholder="4800"
                value={newProduct.buyPrice}
                onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Prix de vente (FCFA) *</label>
              <input
                className="input"
                type="number"
                placeholder="5500"
                value={newProduct.sellPrice}
                onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
            <div className="input-group">
              <label className="input-label">Stock initial</label>
              <input
                className="input"
                type="number"
                placeholder="50"
                value={newProduct.quantityInStock}
                onChange={(e) => setNewProduct({ ...newProduct, quantityInStock: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Seuil d&apos;alerte</label>
              <input
                className="input"
                type="number"
                placeholder="5"
                value={newProduct.alertThreshold}
                onChange={(e) => setNewProduct({ ...newProduct, alertThreshold: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            ✅ Enregistrer le produit
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
            placeholder="Chercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-sm ${stockAlert ? "btn-danger" : "btn-secondary"}`}
          onClick={() => setStockAlert(!stockAlert)}
          style={{ whiteSpace: "nowrap" }}
        >
          ⚠️ Stock bas
        </button>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="product-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="product-item">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "40%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="product-list">
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <div className="product-thumb">📦</div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-meta">
                  Achat: {formatCFA(product.buyPrice)} │ Vente: {formatCFA(product.sellPrice)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`stock-alert ${getStockClass(product)}`}>
                  {getStockLabel(product)}
                </span>
                {product.isPublished && (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-primary)", marginTop: 2 }}>
                    ● En ligne
                  </div>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              {search ? `Aucun produit trouvé pour "${search}"` : "Aucun produit. Ajoutez-en un !"}
            </p>
          )}
        </div>
      )}

      {ToastComponent}
      <BottomNav active="products" />
    </div>
  );
}
