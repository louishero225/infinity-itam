import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const execute = form.get("execute") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tmpDir = join(process.cwd(), "scripts", "reports");
    mkdirSync(tmpDir, { recursive: true });
    const tmpPath = join(tmpDir, `upload-${Date.now()}.xlsx`);
    writeFileSync(tmpPath, buffer);

    const args = [join(process.cwd(), "scripts", "import-inventaire.mjs"), "--file", tmpPath];
    if (execute) args.push("--execute");

    const { stdout, stderr } = await execFileAsync(process.execPath, args, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });

    return NextResponse.json({
      ok: true,
      report: [stdout, stderr].filter(Boolean).join("\n"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur import";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
