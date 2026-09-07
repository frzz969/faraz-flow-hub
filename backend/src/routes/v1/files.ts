import { Router } from "express";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { query, execute } from "../../lib/db.js";
import { asyncHandler, success, ApiError } from "../../lib/errors.js";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { auditLog } from "../../services/audit.js";
import { config } from "../../config.js";

/**
 * File storage (P10): documents upload/download.
 * Files land in backend/uploads/<yyyymm>/<uuid>.<ext>; documents/documents
 * rows carry the metadata + version history.
 */

const uploadsRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "uploads");

const MAX_BYTES = 8 * 1024 * 1024; // 8 MiB via base64 JSON

export const filesRouter = Router();
filesRouter.use(attachUser, requireAuth);

const b64Schema = z
  .string()
  .regex(/^[A-Za-z0-9+/=\r\n]+$/, "dataBase64 must be base64")
  .max(MAX_BYTES * 1.4);

const uploadSchema = z.object({
  title: z.string().min(2).max(190),
  category: z.string().max(48).optional().nullable(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(96).optional().nullable(),
  dataBase64: b64Schema,
  changeNote: z.string().max(255).optional().nullable(),
});

async function storeBytes(dataBase64: string): Promise<{ path: string; size: number }> {
  const buf = Buffer.from(dataBase64.replace(/\r?\n/g, ""), "base64");
  if (buf.length === 0) throw ApiError.badRequest("Empty file content");
  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  const dir = join(uploadsRoot, month);
  await fs.mkdir(dir, { recursive: true });
  const rel = join(month, `${randomBytes(8).toString("hex")}.bin`);
  await fs.writeFile(join(uploadsRoot, rel), buf);
  return { path: rel, size: buf.length };
}

function extOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i > 0 ? fileName.slice(i).slice(0, 16) : "";
}

filesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid upload payload", parsed.error.flatten());
    const { path, size } = await storeBytes(parsed.data.dataBase64);

    const result = await execute(
      `INSERT INTO documents (doc_no, title, category, file_name, file_path, file_size, mime_type, version, status, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?)`,
      [
        `DOC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`,
        parsed.data.title,
        parsed.data.category ?? null,
        parsed.data.fileName + extOf(parsed.data.fileName),
        path,
        size,
        parsed.data.mimeType ?? "application/octet-stream",
        null,
        req.user!.id,
      ]
    );
    const docId = result.insertId;
    await execute(
      `INSERT INTO document_versions (document_id, version, file_name, file_path, file_size, mime_type, change_note, created_by)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?)`,
      [docId, parsed.data.fileName, path, size, parsed.data.mimeType ?? "application/octet-stream", parsed.data.changeNote ?? "Initial upload", req.user!.id]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "CREATE",
      resource: "document",
      resourceId: docId,
      after: { title: parsed.data.title, size },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id: docId, fileName: parsed.data.fileName, size }, 201);
  })
);

filesRouter.get(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    const rows = await query<RowDataPacket>(
      `SELECT dv.version, dv.file_name, dv.file_size, dv.mime_type, dv.change_note, dv.created_at, u.name AS created_by_name
       FROM document_versions dv LEFT JOIN users u ON u.id = dv.created_by
       WHERE dv.document_id = ? ORDER BY dv.version DESC`,
      [Number(req.params.id)]
    );
    success(res, { rows });
  })
);

filesRouter.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const rows = await query<RowDataPacket>("SELECT file_name, file_path, mime_type FROM documents WHERE id = ?", [Number(req.params.id)]);
    const doc = rows[0];
    if (!doc || !doc.file_path) throw ApiError.notFound("Document has no file");
    const abs = join(uploadsRoot, String(doc.file_path));
    try {
      await fs.access(abs);
    } catch {
      throw ApiError.notFound("File missing on disk");
    }
    res.download(abs, doc.file_name ?? "download", (err) => {
      if (err) throw err;
    });
  })
);

filesRouter.post(
  "/:id/version",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid upload payload", parsed.error.flatten());
    const rows = await query<RowDataPacket>("SELECT version FROM documents WHERE id = ?", [id]);
    const doc = rows[0];
    if (!doc) throw ApiError.notFound("Document not found");

    const { path, size } = await storeBytes(parsed.data.dataBase64);
    const nextVersion = Number(doc.version) + 1;
    await execute(
      `UPDATE documents SET file_name = ?, file_path = ?, file_size = ?, mime_type = ?, version = ? WHERE id = ?`,
      [parsed.data.fileName, path, size, parsed.data.mimeType ?? "application/octet-stream", nextVersion, id]
    );
    await execute(
      `INSERT INTO document_versions (document_id, version, file_name, file_path, file_size, mime_type, change_note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nextVersion, parsed.data.fileName, path, size, parsed.data.mimeType ?? "application/octet-stream", parsed.data.changeNote ?? null, req.user!.id]
    );
    await auditLog({
      user: { id: req.user!.id },
      action: "UPDATE",
      resource: "document",
      resourceId: id,
      after: { version: nextVersion, size },
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
    success(res, { id, version: nextVersion, size });
  })
);