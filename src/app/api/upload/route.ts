import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file || !productId) {
    return NextResponse.json({ error: "Arquivo e produto são obrigatórios" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WebP ou GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Imagem muito grande. Máximo 3MB." }, { status: 400 });
  }

  // Verify product ownership
  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id, active: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const storagePath = `${session.user.id}/${productId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao fazer upload da imagem" }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  await prisma.product.update({
    where: { id: productId },
    data: { imageUrl: urlData.publicUrl },
  });

  return NextResponse.json({ imageUrl: urlData.publicUrl });
}
