import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional().transform((v) => v === "" ? undefined : v),
  costPrice: z.number().min(0),
  salePrice: z.number().min(0),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  unit: z.string().default("un"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || undefined;
  const lowStock = searchParams.get("lowStock") === "true";

  const allProducts = await prisma.product.findMany({
    where: {
      userId: session.user.id,
      active: true,
      ...(search && { name: { contains: search } }),
      ...(categoryId && { categoryId }),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const products = lowStock
    ? allProducts.filter((p) => p.stock <= p.minStock)
    : allProducts;

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: { ...data, userId: session.user.id },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar produto" }, { status: 500 });
  }
}
