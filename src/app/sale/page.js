"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCFA } from "@/lib/format";
import { useToast } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";

export default function SalePage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const searchRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("CASH");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Search products with debounce
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProducts(data.data.products);
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Cart calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
  const netAmount = totalAmount - discount;

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      showToast("Ajoutez au moins un produit", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        discountAmount: discount,
        paymentMethod: selectedPayment,
        paymentAmount: selectedPayment === "CREDIT" ? 0 : netAmount,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Vente ${data.data.saleNumber} enregistrée ✅`, "success");
        setCart([]);
        setDiscount(0);
        setSelectedCustomer(null);
        setSearchQuery("");
        searchRef.current?.focus();
      } else {
        showToast(data.message || "Erreur lors de la vente", "danger");
      }
    } catch (err) {
      showToast("Erreur de connexion", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: "CASH", icon: "💵", label: "Espèces" },
    { id: "WAVE", icon: "📱", label: "Wave" },
    { id: "ORANGE_MONEY", icon: "📱", label: "OM" },
    { id: "CREDIT", icon: "📝", label: "Crédit" },
  ];

  return (
    <div className="container page-content">
      <div className="page-header">
        <button
          className="btn btn-ghost"
          onClick={() => router.push("/dashboard")}
          style={{ padding: "8px 0" }}
        >
          ← Retour
        </button>
        <h1 className="page-header-title">Nouvelle vente</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Search */}
      <div className="input-with-icon" style={{ marginBottom: "var(--space-md)" }}>
        <span className="input-icon">🔍</span>
        <input
          ref={searchRef}
          className="input"
          type="search"
          placeholder="Chercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery && products.length > 0 && (
        <div
          className="product-list animate-fade-in"
          style={{ marginBottom: "var(--space-md)", maxHeight: 200, overflowY: "auto" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="product-item"
              onClick={() => addToCart(product)}
              style={{ padding: "10px 12px" }}
            >
              <div className="product-thumb">📦</div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-meta">
                  Stock: {product.quantityInStock} {product.unit}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="product-price">{formatCFA(product.sellPrice)}</span>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && products.length === 0 && (
        <p className="text-muted" style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
          Aucun produit trouvé pour &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="cart animate-fade-in" style={{ marginBottom: "var(--space-md)" }}>
          <div className="cart-header">🛒 Panier ({cart.length} article{cart.length > 1 ? "s" : ""})</div>

          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-name">
                {item.name}
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  {formatCFA(item.sellPrice)} × {item.quantity}
                </div>
              </div>
              <div className="cart-item-qty">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{ width: 32, height: 32, padding: 0, minHeight: 32 }}
                >
                  −
                </button>
                <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>
                  {item.quantity}
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{ width: 32, height: 32, padding: 0, minHeight: 32 }}
                >
                  +
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span className="amount">{formatCFA(item.sellPrice * item.quantity)}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 0,
                  }}
                  aria-label={`Supprimer ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {/* Discount */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "var(--font-size-sm)" }}>Remise :</span>
            <input
              type="number"
              className="input"
              value={discount || ""}
              onChange={(e) => setDiscount(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              style={{
                width: 100,
                minHeight: 36,
                padding: "4px 8px",
                textAlign: "right",
                fontSize: "var(--font-size-sm)",
              }}
              min={0}
            />
          </div>

          {/* Total */}
          <div className="cart-total">
            <span>TOTAL</span>
            <span>{formatCFA(netAmount)}</span>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {cart.length > 0 && (
        <>
          <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: 8 }}>
            Moyen de paiement :
          </p>
          <div className="payment-methods">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                className={`payment-method ${selectedPayment === method.id ? "selected" : ""}`}
                onClick={() => setSelectedPayment(method.id)}
              >
                <span className="method-icon">{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmitSale}
            disabled={submitting || cart.length === 0}
            style={{ marginTop: "var(--space-sm)", fontSize: "var(--font-size-lg)" }}
          >
            {submitting ? "Enregistrement..." : `✅ Valider ${formatCFA(netAmount)}`}
          </button>
        </>
      )}

      {/* Empty state */}
      {cart.length === 0 && !searchQuery && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-2xl) var(--space-md)",
            color: "var(--color-text-muted)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: "var(--space-md)" }}>🛒</div>
          <p>Cherchez un produit pour commencer une vente</p>
        </div>
      )}

      {ToastComponent}
      <BottomNav active="sale" />
    </div>
  );
}
