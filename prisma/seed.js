const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding JangiBoutik database...\n");

  // 1. Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: "Boutique Diouf",
      phone: "+221771234567",
      address: "Parcelles Assainies U17, Dakar",
      currency: "XOF",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Organisation créée:", org.name);

  // 2. Create owner user (password: demo1234)
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      phone: "+221771234567",
      passwordHash,
      fullName: "Joseph Diouf",
      role: "OWNER",
    },
  });
  console.log("✅ Utilisateur créé:", owner.fullName, "(mot de passe: demo1234)");

  // 3. Create trial subscription
  const now = new Date();
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: "BASIC",
      status: "TRIAL",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      amount: 0,
    },
  });
  console.log("✅ Abonnement essai créé (14 jours)");

  // 4. Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { organizationId: org.id, name: "Alimentation", sortOrder: 1 } }),
    prisma.category.create({ data: { organizationId: org.id, name: "Boissons", sortOrder: 2 } }),
    prisma.category.create({ data: { organizationId: org.id, name: "Hygiène", sortOrder: 3 } }),
    prisma.category.create({ data: { organizationId: org.id, name: "Divers", sortOrder: 4 } }),
  ]);
  console.log("✅ Catégories créées:", categories.map((c) => c.name).join(", "));

  // 5. Create products
  const productsData = [
    { name: "Riz brisé 25kg", buyPrice: 9500, sellPrice: 11000, quantityInStock: 30, alertThreshold: 5, categoryId: categories[0].id },
    { name: "Riz brisé 5kg", buyPrice: 2200, sellPrice: 2500, quantityInStock: 45, alertThreshold: 10, categoryId: categories[0].id },
    { name: "Huile Dior 1L", buyPrice: 900, sellPrice: 1100, quantityInStock: 40, alertThreshold: 8, categoryId: categories[0].id },
    { name: "Huile Dior 5L", buyPrice: 4200, sellPrice: 5000, quantityInStock: 15, alertThreshold: 3, categoryId: categories[0].id },
    { name: "Sucre en poudre 1kg", buyPrice: 550, sellPrice: 650, quantityInStock: 60, alertThreshold: 10, categoryId: categories[0].id },
    { name: "Lait Nido 400g", buyPrice: 2200, sellPrice: 2800, quantityInStock: 25, alertThreshold: 5, categoryId: categories[0].id },
    { name: "Lait Nido 900g", buyPrice: 4500, sellPrice: 5500, quantityInStock: 12, alertThreshold: 3, categoryId: categories[0].id },
    { name: "Café Touba 250g", buyPrice: 800, sellPrice: 1000, quantityInStock: 35, alertThreshold: 8, categoryId: categories[0].id },
    { name: "Pâtes Pasta Roni 500g", buyPrice: 350, sellPrice: 450, quantityInStock: 50, alertThreshold: 10, categoryId: categories[0].id },
    { name: "Tomate concentrée 70g", buyPrice: 100, sellPrice: 150, quantityInStock: 100, alertThreshold: 20, categoryId: categories[0].id },
    { name: "Bouillon Maggi (sachet x12)", buyPrice: 150, sellPrice: 200, quantityInStock: 80, alertThreshold: 15, categoryId: categories[0].id },
    { name: "Coca-Cola 33cl", buyPrice: 200, sellPrice: 300, quantityInStock: 48, alertThreshold: 12, categoryId: categories[1].id },
    { name: "Fanta Orange 33cl", buyPrice: 200, sellPrice: 300, quantityInStock: 36, alertThreshold: 12, categoryId: categories[1].id },
    { name: "Eau minérale Kirène 1.5L", buyPrice: 150, sellPrice: 250, quantityInStock: 50, alertThreshold: 10, categoryId: categories[1].id },
    { name: "Jus Pressea Mangue 1L", buyPrice: 600, sellPrice: 800, quantityInStock: 20, alertThreshold: 5, categoryId: categories[1].id },
    { name: "Savon Palmolive", buyPrice: 250, sellPrice: 350, quantityInStock: 30, alertThreshold: 5, categoryId: categories[2].id },
    { name: "Dentifrice Signal 75ml", buyPrice: 400, sellPrice: 550, quantityInStock: 20, alertThreshold: 5, categoryId: categories[2].id },
    { name: "Couches Pampers (paquet x30)", buyPrice: 3500, sellPrice: 4500, quantityInStock: 8, alertThreshold: 3, categoryId: categories[2].id },
    { name: "Lessive Omo 500g", buyPrice: 600, sellPrice: 800, quantityInStock: 25, alertThreshold: 5, categoryId: categories[2].id },
    { name: "Pile AA (lot de 4)", buyPrice: 300, sellPrice: 500, quantityInStock: 15, alertThreshold: 5, categoryId: categories[3].id },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        organizationId: org.id,
        ...p,
        unit: "pièce",
        isPublished: Math.random() > 0.3, // 70% publiés
      },
    });
    products.push(product);
  }
  console.log(`✅ ${products.length} produits créés`);

  // 6. Create customers
  const customersData = [
    { fullName: "Moussa Diop", phone: "+221775551234", address: "Guédiawaye" },
    { fullName: "Fatou Sow", phone: "+221769871234", address: "Pikine" },
    { fullName: "Amadou Ba", phone: "+221781234567", address: "Parcelles Assainies" },
    { fullName: "Aissatou Ndiaye", phone: "+221771111111", address: "Grand Yoff" },
    { fullName: "Ibrahima Fall", phone: "+221762222222", address: "Ouakam" },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: { organizationId: org.id, ...c },
    });
    customers.push(customer);
  }
  console.log(`✅ ${customers.length} clients créés`);

  // 7. Create a public catalog
  await prisma.publicCatalog.create({
    data: {
      organizationId: org.id,
      slug: "boutique-diouf",
      title: "Boutique Diouf",
      description: "Votre boutique de quartier à Parcelles Assainies. Livraison à Dakar et banlieue.",
      whatsappNumber: "+221771234567",
      deliveryZones: "Dakar, Guédiawaye, Pikine, Parcelles Assainies",
      isActive: true,
    },
  });
  console.log("✅ Catalogue public créé (slug: boutique-diouf)");

  console.log("\n🎉 Seed terminé avec succès !");
  console.log("\n📋 Connexion de démonstration :");
  console.log("   Téléphone : +221771234567");
  console.log("   Mot de passe : demo1234");
  console.log("   Catalogue public : /c/boutique-diouf");
}

main()
  .catch((e) => {
    console.error("❌ Erreur de seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
