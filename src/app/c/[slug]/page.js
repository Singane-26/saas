import prisma from "@/lib/prisma";
import { formatCFA } from "@/lib/format";

/**
 * GET /c/[slug]
 * Public catalog page — Server-Side Rendered, no authentication needed.
 * This page is shareable on WhatsApp, Instagram, and Facebook.
 */
export async function generateMetadata({ params }) {
  const catalog = await prisma.publicCatalog.findUnique({
    where: { slug: params.slug },
    include: { organization: { select: { name: true } } },
  });

  if (!catalog) {
    return { title: "Catalogue non trouvé" };
  }

  return {
    title: `${catalog.title} — Catalogue en ligne`,
    description: catalog.description || `Découvrez les produits de ${catalog.organization.name}`,
    openGraph: {
      title: catalog.title,
      description: catalog.description || `Catalogue de ${catalog.organization.name}`,
      images: catalog.bannerUrl ? [{ url: catalog.bannerUrl }] : [],
    },
  };
}

export default async function PublicCatalogPage({ params, searchParams }) {
  const { slug } = params;
  const categoryFilter = searchParams?.category || null;

  // Fetch catalog with organization
  const catalog = await prisma.publicCatalog.findUnique({
    where: { slug, isActive: true },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          address: true,
        },
      },
    },
  });

  if (!catalog) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Catalogue non trouvé</h1>
        <p style={{ color: "#64748B" }}>
          Ce lien n&apos;est pas valide ou le catalogue a été désactivé.
        </p>
      </div>
    );
  }

  // Fetch published products
  const where = {
    organizationId: catalog.organization.id,
    isPublished: true,
    isActive: true,
  };

  if (categoryFilter) {
    where.category = { name: categoryFilter };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { select: { imageUrl: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: {
        organizationId: catalog.organization.id,
        products: { some: { isPublished: true, isActive: true } },
      },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const whatsappBase = `https://wa.me/${catalog.whatsappNumber.replace(/\D/g, "")}`;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", minHeight: "100vh", background: "#F7F8FA" }}>
      {/* Banner */}
      <div
        style={{
          background: catalog.bannerUrl
            ? `url(${catalog.bannerUrl}) center/cover`
            : "linear-gradient(135deg, #0A8F4F 0%, #12B866 100%)",
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "0 0 16px 16px",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        {catalog.organization.logoUrl ? (
          <img
            src={catalog.organization.logoUrl}
            alt={catalog.organization.name}
            style={{ width: 64, height: 64, borderRadius: "50%", marginBottom: 8, objectFit: "cover" }}
          />
        ) : (
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏪</div>
        )}
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
          {catalog.title}
        </h1>
        {catalog.description && (
          <p style={{ fontSize: "0.875rem", opacity: 0.9, marginTop: 4 }}>{catalog.description}</p>
        )}
      </div>

      {/* Categories */}
      {categories.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <a
            href={`/c/${slug}`}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: !categoryFilter ? "#0A8F4F" : "#fff",
              color: !categoryFilter ? "#fff" : "#64748B",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
            }}
          >
            Tout
          </a>
          {categories.map((cat) => (
            <a
              key={cat.name}
              href={`/c/${slug}?category=${encodeURIComponent(cat.name)}`}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: "0.8125rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                background: categoryFilter === cat.name ? "#0A8F4F" : "#fff",
                color: categoryFilter === cat.name ? "#fff" : "#64748B",
                border: "1px solid #E2E8F0",
                textDecoration: "none",
              }}
            >
              {cat.name}
            </a>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="catalog-grid">
        {products.map((product) => {
          const imageUrl = product.images[0]?.imageUrl;
          const isOutOfStock = product.quantityInStock <= 0;

          // Pre-fill WhatsApp order message
          const orderMessage = `Bonjour, je souhaite commander :\n\n📦 ${product.name}\n💰 ${formatCFA(product.sellPrice)}\n\nMerci !`;
          const orderLink = `${whatsappBase}?text=${encodeURIComponent(orderMessage)}`;

          return (
            <div key={product.id} className="catalog-card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
              <div
                className="catalog-card-img"
                style={{
                  background: imageUrl
                    ? `url(${imageUrl}) center/cover`
                    : "#E8F7EF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                }}
              >
                {!imageUrl && "📦"}
              </div>
              <div className="catalog-card-body">
                <div className="catalog-card-name">{product.name}</div>
                <div className="catalog-card-price">{formatCFA(product.sellPrice)}</div>
                {isOutOfStock ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "6px 0",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#E74C3C",
                      background: "#FDE8E8",
                      borderRadius: 6,
                    }}
                  >
                    RUPTURE
                  </div>
                ) : (
                  <a
                    href={orderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="catalog-order-btn"
                  >
                    📱 Commander
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Aucun produit disponible pour le moment.</p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "24px 16px 32px",
          borderTop: "1px solid #E2E8F0",
          marginTop: 24,
        }}
      >
        <a
          href={whatsappBase}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "#25D366",
            color: "white",
            borderRadius: 24,
            fontWeight: 600,
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}
        >
          📱 Contacter sur WhatsApp
        </a>

        {catalog.deliveryZones && (
          <p style={{ fontSize: "0.8125rem", color: "#64748B", marginTop: 12 }}>
            📍 Livraison : {catalog.deliveryZones}
          </p>
        )}

        <p style={{ fontSize: "0.6875rem", color: "#CBD5E1", marginTop: 16 }}>
          Propulsé par <strong>JangiBoutik</strong>
        </p>
      </div>
    </div>
  );
}
