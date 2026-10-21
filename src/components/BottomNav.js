"use client";

import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { id: "home", label: "Accueil", icon: "🏠", path: "/dashboard" },
  { id: "sale", label: "Vente", icon: "🛒", path: "/sale" },
  { id: "products", label: "Stock", icon: "📦", path: "/products" },
  { id: "customers", label: "Clients", icon: "👥", path: "/customers" },
  { id: "more", label: "Plus", icon: "⚙️", path: "/more" },
];

/**
 * Bottom navigation bar for the mobile-first PWA.
 * Fixed at the bottom of the screen on all authenticated pages.
 *
 * @param {{ active: string }} props - The ID of the active nav item
 */
export default function BottomNav({ active }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentActive = active || navItems.find((item) => pathname.startsWith(item.path))?.id;

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav-item ${currentActive === item.id ? "active" : ""}`}
          onClick={() => router.push(item.path)}
          aria-label={item.label}
          aria-current={currentActive === item.id ? "page" : undefined}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
