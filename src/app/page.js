"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [phone, setPhone] = useState("+221");
  const [password, setPassword] = useState("");

  // Register form additional fields
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { phone, password }
        : { phone, password, fullName, organizationName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Une erreur est survenue");
        return;
      }

      // Store token and user data
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("organization", JSON.stringify(data.data.organization));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Erreur de connexion. Vérifiez votre internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏪</div>
          <h1>JangiBoutik</h1>
          <p>Gérez votre commerce simplement</p>
        </div>

        {error && (
          <div
            style={{
              background: "var(--color-danger-light)",
              color: "var(--color-danger)",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              marginBottom: "var(--space-md)",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="orgName">
                  Nom de la boutique
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">🏪</span>
                  <input
                    id="orgName"
                    className="input"
                    type="text"
                    placeholder="Ma Boutique Dakar"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="fullName">
                  Votre nom complet
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">👤</span>
                  <input
                    id="fullName"
                    className="input"
                    type="text"
                    placeholder="Moussa Diop"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="phone">
              Numéro de téléphone
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input
                id="phone"
                className="input"
                type="tel"
                placeholder="+221 7X XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Mot de passe
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: "var(--space-sm)" }}
          >
            {loading ? "Chargement..." : isLogin ? "Se connecter →" : "Créer mon compte →"}
          </button>
        </form>

        {isLogin && (
          <p
            style={{
              textAlign: "center",
              marginTop: "var(--space-md)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-primary)",
              cursor: "pointer",
            }}
          >
            Mot de passe oublié ?
          </p>
        )}

        <div className="auth-divider">ou</div>

        <button
          className="btn btn-secondary btn-full"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
        >
          {isLogin ? "Créer un compte →" : "← J'ai déjà un compte"}
        </button>
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: "var(--font-size-xs)",
          marginTop: "var(--space-lg)",
          textAlign: "center",
        }}
      >
        Essai gratuit de 14 jours • Paiement par Wave & Orange Money
      </p>
    </div>
  );
}
