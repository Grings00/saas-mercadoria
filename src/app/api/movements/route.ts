import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const movementSchema = z
  .object({
    productId: z.string(),
    type: z.enum(["ENTRADA", "SAIDA"]),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0).default(0),
    notes: z.string().optional(),
    responsibleId: z.string().optional(),
  })
  .refine((d) => d.type !== "SAIDA" || !!d.responsibleId, {
    message: "Selecione o responsável pela saída",
    path: ["responsibleId"],
  });

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || undefined;
  const type = searchParams.get("type") as "ENTRADA" | "SAIDA" | null;
  const responsibleId = searchParams.get("responsibleId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.movement.findMany({
      where: {
        userId: session.user.id,
        ...(productId && { productId }),
        ...(type && { type }),
        ...(responsibleId && { responsibleId }),
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        responsible: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.movement.count({
      where: {
        userId: session.user.id,
        ...(productId && { productId }),
        ...(type && { type }),
        ...(responsibleId && { responsibleId }),
      },
    }),
  ]);

  return NextResponse.json({ movements, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = movementSchema.parse(body);

    const product = await prisma.product.findFirst({
      where: { id: data.productId, userId: session.user.id, active: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (data.type === "SAIDA" && product.stock < data.quantity) {
      return NextResponse.json(
        { error: "Estoque insuficiente para esta saída" },
        { status: 400 }
      );
    }

    if (data.type === "SAIDA" && data.responsibleId) {
      const responsible = await prisma.responsible.findFirst({
        where: { id: data.responsibleId, userId: session.user.id, active: true },
      });
      if (!responsible) {
        return NextResponse.json({ error: "Responsável inválido" }, { status: 400 });
      }
    }

    const totalValue = data.quantity * data.unitPrice;
    const stockDelta = data.type === "ENTRADA" ? data.quantity : -data.quantity;
    const responsibleId = data.type === "SAIDA" ? data.responsibleId : null;

    const [movement] = await prisma.$transaction([
      prisma.movement.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          notes: data.notes,
          totalValue,
          responsibleId,
          userId: session.user.id,
        },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          responsible: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.product.update({
        where: { id: data.productId },
        data: { stock: { increment: stockDelta } },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao registrar movimentação" }, { status: 500 });
  }
}
