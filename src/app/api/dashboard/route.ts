import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [products, movements, monthMovements] = await Promise.all([
    prisma.product.findMany({
      where: { userId, active: true },
      select: { stock: true, minStock: true, costPrice: true, salePrice: true },
    }),
    prisma.movement.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { type: true, quantity: true, totalValue: true },
    }),
    prisma.movement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        type: true,
        quantity: true,
        totalValue: true,
        createdAt: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock).length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.stock * p.costPrice,
    0
  );

  const entriesThisMonth = monthMovements.filter((m) => m.type === "ENTRADA");
  const exitsThisMonth = monthMovements.filter((m) => m.type === "SAIDA");

  const monthEntries = entriesThisMonth.reduce((s, m) => s + m.quantity, 0);
  const monthExits = exitsThisMonth.reduce((s, m) => s + m.quantity, 0);
  const monthEntriesValue = entriesThisMonth.reduce((s, m) => s + m.totalValue, 0);
  const monthExitsValue = exitsThisMonth.reduce((s, m) => s + m.totalValue, 0);

  // Last 6 months chart data
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const month = d.toLocaleString("pt-BR", { month: "short" });
    chartData.push({ month, start: start.toISOString(), end: end.toISOString() });
  }

  const chartMovements = await prisma.movement.groupBy({
    by: ["type", "createdAt"],
    where: {
      userId,
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      },
    },
    _sum: { totalValue: true },
  });

  return NextResponse.json({
    totalProducts,
    lowStockProducts,
    monthEntries,
    monthExits,
    totalStockValue,
    monthEntriesValue,
    monthExitsValue,
    recentMovements: monthMovements.slice(0, 10),
  });
}
