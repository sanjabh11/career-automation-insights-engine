import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_RESUME_UPLOAD_BYTES = 2 * 1024 * 1024;
const SOURCE_IDS = ["owasp-file-upload", "supabase-edge-functions", "nist-ai-rmf", "ada-ai-hiring-guidance"];

type ResumeFileKind = "txt" | "pdf" | "doc" | "docx" | "unknown";

interface ResumeParserReceipt {
  receiptId: string;
  generatedAt: string;
  filename: string;
  filenameHash: string;
  fileSha256: string;
  byteLength: number;
  declaredMimeType: string;
  detectedFileKind: ResumeFileKind;
  accepted: boolean;
  extractedTextAvailable: boolean;
  inputMode: string;
  rawFileStored: false;
  rawResumeTextStored: false;
  productionPdfDocxParser: boolean;
  tempFileDeletionStatus: "not_persisted";
  deletionStatus: "not_persisted";
  validationControls: string[];
  sourceIds: string[];
  caveat: string;
  doesNotProve: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: Uint8Array | string): Promise<string> {
  const input = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return hex(await crypto.subtle.digest("SHA-256", input));
}

function extensionFor(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function printableRatio(text: string): number {
  if (!text.length) return 0;
  const printable = Array.from(text).filter((char) => {
    const code = char.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
  }).length;
  return printable / text.length;
}

function detectFileKind(filename: string, bytes: Uint8Array): ResumeFileKind {
  const extension = extensionFor(filename);
  const isPdf = startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  const isZip =
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  const isOleDoc = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);

  if (extension === "pdf" && isPdf) return "pdf";
  if (extension === "docx" && isZip) return "docx";
  if (extension === "doc" && isOleDoc) return "doc";
  if (extension === "txt" && !isPdf && !isZip && !isOleDoc) return "txt";
  return "unknown";
}

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false })
    .decode(bytes)
    .replace(new RegExp(String.fromCharCode(0), "g"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildReceipt(params: {
  filename: string;
  filenameHash: string;
  fileSha256: string;
  byteLength: number;
  declaredMimeType: string;
  detectedFileKind: ResumeFileKind;
  accepted: boolean;
  extractedTextAvailable: boolean;
  caveat: string;
}): ResumeParserReceipt {
  return {
    receiptId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    filename: params.filename,
    filenameHash: params.filenameHash,
    fileSha256: params.fileSha256,
    byteLength: params.byteLength,
    declaredMimeType: params.declaredMimeType,
    detectedFileKind: params.detectedFileKind,
    accepted: params.accepted,
    extractedTextAvailable: params.extractedTextAvailable,
    inputMode: `server_multipart_${params.detectedFileKind}`,
    rawFileStored: false,
    rawResumeTextStored: false,
    productionPdfDocxParser: false,
    tempFileDeletionStatus: "not_persisted",
    deletionStatus: "not_persisted",
    validationControls: [
      "extension_allowlist",
      "declared_content_type_recorded_not_trusted",
      "file_signature_check",
      "max_upload_size_2mb",
      "no_public_storage_write",
      "no_raw_resume_text_persistence",
    ],
    sourceIds: SOURCE_IDS,
    caveat: params.caveat,
    doesNotProve:
      "This receipt does not prove the file is malware-free, that PDF/DOC/DOCX text extraction is complete, or that external model-provider logs, browser downloads, user exports, or backups were deleted.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonResponse({
        success: false,
        error: "multipart_form_data_required",
        source_ids: SOURCE_IDS,
        caveat: "Resume files must be submitted as multipart/form-data so the server can validate file metadata and size before parsing.",
      }, 415);
    }

    const formData = await req.formData();
    const candidateFile = formData.get("resume_file");
    if (!(candidateFile instanceof File)) {
      return jsonResponse({
        success: false,
        error: "resume_file_required",
        source_ids: SOURCE_IDS,
      }, 400);
    }

    const filename = candidateFile.name || "resume-upload";
    const declaredMimeType = candidateFile.type || "application/octet-stream";
    const filenameHash = await sha256(filename);

    if (candidateFile.size > MAX_RESUME_UPLOAD_BYTES) {
      const prefixBytes = new Uint8Array(await candidateFile.slice(0, 16).arrayBuffer());
      const detectedFileKind = detectFileKind(filename, prefixBytes);
      const parserReceipt = buildReceipt({
        filename,
        filenameHash,
        fileSha256: "not_computed_file_too_large",
        byteLength: candidateFile.size,
        declaredMimeType,
        detectedFileKind,
        accepted: false,
        extractedTextAvailable: false,
        caveat: "The upload exceeded the 2MB parser boundary. Use a smaller text export or a dedicated document parser before paid pilot delivery.",
      });
      return jsonResponse({ success: false, error: "file_too_large", parser_receipt: parserReceipt }, 413);
    }

    const bytes = new Uint8Array(await candidateFile.arrayBuffer());
    const detectedFileKind = detectFileKind(filename, bytes.slice(0, 16));
    const fileSha256 = await sha256(bytes);

    if (detectedFileKind === "unknown") {
      const parserReceipt = buildReceipt({
        filename,
        filenameHash,
        fileSha256,
        byteLength: bytes.byteLength,
        declaredMimeType,
        detectedFileKind,
        accepted: false,
        extractedTextAvailable: false,
        caveat: "The upload did not match the allowed resume extensions/signatures. Only txt, pdf, doc, and docx are accepted at this boundary.",
      });
      return jsonResponse({ success: false, error: "unsupported_file_type", parser_receipt: parserReceipt }, 415);
    }

    if (detectedFileKind !== "txt") {
      const parserReceipt = buildReceipt({
        filename,
        filenameHash,
        fileSha256,
        byteLength: bytes.byteLength,
        declaredMimeType,
        detectedFileKind,
        accepted: true,
        extractedTextAvailable: false,
        caveat:
          "The server validated the upload boundary without storing the file, but PDF/DOC/DOCX extraction is adapter-pending. Export to text or deploy a dedicated parser with malware-scan and deletion evidence before selling this workflow.",
      });
      return jsonResponse({
        success: false,
        error: "parser_adapter_pending",
        parser_receipt: parserReceipt,
      }, 422);
    }

    const extractedText = decodeText(bytes);
    if (extractedText.length < 1 || printableRatio(extractedText) < 0.75) {
      const parserReceipt = buildReceipt({
        filename,
        filenameHash,
        fileSha256,
        byteLength: bytes.byteLength,
        declaredMimeType,
        detectedFileKind,
        accepted: false,
        extractedTextAvailable: false,
        caveat: "The text upload could not be decoded reliably. Paste clean resume text or export a UTF-8 .txt file.",
      });
      return jsonResponse({ success: false, error: "text_decode_failed", parser_receipt: parserReceipt }, 422);
    }

    const parserReceipt = buildReceipt({
      filename,
      filenameHash,
      fileSha256,
      byteLength: bytes.byteLength,
      declaredMimeType,
      detectedFileKind,
      accepted: true,
      extractedTextAvailable: true,
      caveat:
        "The server validated a text resume upload, extracted text in memory, and did not persist the raw file or raw resume text. PDF/DOC/DOCX parser readiness still requires a dedicated adapter.",
    });

    return jsonResponse({
      success: true,
      extracted_text: extractedText,
      parser_receipt: parserReceipt,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "unknown_parse_resume_error",
      source_ids: SOURCE_IDS,
    }, 400);
  }
});
