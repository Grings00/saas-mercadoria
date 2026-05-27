import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional().nullable().transform((v) => v === "" ? null : v),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  active: z.boolean().optional(),
});

async function verifyOwnership(id: string, userId: string) {
  return prisma.product.findFirst({ where: { id, userId } });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const product = await prisma.product.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      category: { select: { id: true, name: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          quantity: true,
          unitPrice: true,
          totalValue: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const owned = await verifyOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const owned = await verifyOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  await prisma.product.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
