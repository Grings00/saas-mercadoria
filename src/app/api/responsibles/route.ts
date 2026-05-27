import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  role: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const responsibles = await prisma.responsible.findMany({
    where: { userId: session.user.id, active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(responsibles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const responsible = await prisma.responsible.create({
      data: {
        name: data.name,
        role: data.role || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(responsible, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar responsável" }, { status: 500 });
  }
}
