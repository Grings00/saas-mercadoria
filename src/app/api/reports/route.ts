import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();

  // Monthly chart data for last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const label = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });

    const [entries, exits] = await Promise.all([
      prisma.movement.aggregate({
        where: { userId, type: "ENTRADA", createdAt: { gte: start, lte: end } },
        _sum: { totalValue: true, quantity: true },
      }),
      prisma.movement.aggregate({
        where: { userId, type: "SAIDA", createdAt: { gte: start, lte: end } },
        _sum: { totalValue: true, quantity: true },
      }),
    ]);

    monthlyData.push({
      month: label,
      entradas: entries._sum.totalValue || 0,
      saidas: exits._sum.totalValue || 0,
      qtdEntradas: entries._sum.quantity || 0,
      qtdSaidas: exits._sum.quantity || 0,
    });
  }

  // Top products by movement
  const topProducts = await prisma.movement.groupBy({
    by: ["productId"],
    where: { userId },
    _sum: { quantity: true, totalValue: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const topProductsWithNames = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        select: { name: true, unit: true },
      });
      return {
        name: product?.name || "Produto removido",
        unit: product?.unit || "un",
        totalMovimentos: tp._count.id,
        totalQuantidade: tp._sum.quantity || 0,
        totalValor: tp._sum.totalValue || 0,
      };
    })
  );

  // Low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
      unit: true,
      category: { select: { name: true } },
    },
    orderBy: { stock: "asc" },
  });

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);

  return NextResponse.json({
    monthlyData,
    topProducts: topProductsWithNames,
    lowStockProducts: lowStock,
  });
}
