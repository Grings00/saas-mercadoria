import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@mercadoria.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "demo@mercadoria.com",
      password,
      company: "Mercado do João",
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name_userId: { name: "Alimentos", userId: user.id } },
      update: {},
      create: { name: "Alimentos", userId: user.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Bebidas", userId: user.id } },
      update: {},
      create: { name: "Bebidas", userId: user.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Limpeza", userId: user.id } },
      update: {},
      create: { name: "Limpeza", userId: user.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Higiene", userId: user.id } },
      update: {},
      create: { name: "Higiene", userId: user.id },
    }),
  ]);

  const products = [
    {
      name: "Arroz Tipo 1 5kg",
      sku: "ARR001",
      categoryId: categories[0].id,
      costPrice: 18.5,
      salePrice: 24.9,
      stock: 45,
      minStock: 10,
      unit: "un",
    },
    {
      name: "Feijão Carioca 1kg",
      sku: "FEI001",
      categoryId: categories[0].id,
      costPrice: 6.8,
      salePrice: 9.9,
      stock: 3,
      minStock: 10,
      unit: "un",
    },
    {
      name: "Óleo de Soja 900ml",
      sku: "OLE001",
      categoryId: categories[0].id,
      costPrice: 7.2,
      salePrice: 10.5,
      stock: 28,
      minStock: 8,
      unit: "un",
    },
    {
      name: "Açúcar Cristal 1kg",
      sku: "ACU001",
      categoryId: categories[0].id,
      costPrice: 3.8,
      salePrice: 5.9,
      stock: 2,
      minStock: 15,
      unit: "un",
    },
    {
      name: "Refrigerante Cola 2L",
      sku: "REF001",
      categoryId: categories[1].id,
      costPrice: 6.5,
      salePrice: 9.9,
      stock: 60,
      minStock: 12,
      unit: "un",
    },
    {
      name: "Água Mineral 500ml",
      sku: "AGU001",
      categoryId: categories[1].id,
      costPrice: 0.9,
      salePrice: 1.99,
      stock: 120,
      minStock: 24,
      unit: "un",
    },
    {
      name: "Suco de Laranja 1L",
      sku: "SUC001",
      categoryId: categories[1].id,
      costPrice: 4.5,
      salePrice: 7.5,
      stock: 18,
      minStock: 6,
      unit: "un",
    },
    {
      name: "Detergente Líquido 500ml",
      sku: "DET001",
      categoryId: categories[2].id,
      costPrice: 2.1,
      salePrice: 3.49,
      stock: 35,
      minStock: 10,
      unit: "un",
    },
    {
      name: "Sabão em Pó 1kg",
      sku: "SAB001",
      categoryId: categories[2].id,
      costPrice: 8.9,
      salePrice: 13.9,
      stock: 1,
      minStock: 8,
      unit: "un",
    },
    {
      name: "Shampoo 350ml",
      sku: "SHA001",
      categoryId: categories[3].id,
      costPrice: 9.5,
      salePrice: 14.9,
      stock: 22,
      minStock: 5,
      unit: "un",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        id: `seed-${product.sku}`,
      },
      update: {},
      create: {
        id: `seed-${product.sku}`,
        ...product,
        userId: user.id,
      },
    });
  }

  console.log("Seed concluído com sucesso!");
  console.log("Login de demonstração:");
  console.log("  Email: demo@mercadoria.com");
  console.log("  Senha: 123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
