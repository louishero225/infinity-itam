import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { requireUserApi } from "@/lib/auth/require-user-api";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const limited = rateLimit(`qr:${auth.user.id}`, 40);
  if (!limited.ok) {
    return new NextResponse("Trop de requêtes", { status: 429 });
  }

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("materiels")
    .select("id, code_materiel")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Matériel introuvable", { status: 404 });
  }

  const png = await QRCode.toBuffer(data.code_materiel, {
    type: "png",
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
