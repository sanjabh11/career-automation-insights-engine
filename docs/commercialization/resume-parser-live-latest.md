# Resume Parser Live Proof

Generated: 2026-05-25T17:30:46.379Z
Verifier: `verify-resume-parser-live`
Mode: `live-edge-function-parser-boundary`
Target: `kvunnankqgfokeufvsrv.supabase.co`
All passed: true
Skipped: false

## Caveat

This verifies the deployed parse-resume Edge Function behavior from the public functions endpoint using synthetic non-sensitive fixtures. It does not apply migrations, deploy functions, prove authenticated resume artifact save/delete, prove malware scanning, or prove production PDF/DOC/DOCX extraction.

## Does Not Prove

This does not prove uploaded files are malware-free, that PDF/DOC/DOCX parsing is production-ready, that raw data is removed from every browser download/export/provider log/backup, or that the workflow is valid for employment decisions.

## Checks

| Result | Check | HTTP | Classification | Receipt Sources | Caveat |
| --- | --- | ---: | --- | --- | --- |
| pass | `txt-success-boundary` | 200 | text-extracted-non-persistent | owasp-file-upload, supabase-edge-functions, nist-ai-rmf, ada-ai-hiring-guidance | The server validated a text resume upload, extracted text in memory, and did not persist the raw file or raw resume text. PDF/DOC/DOCX parser readiness still requires a dedicated adapter. |
| pass | `pdf-adapter-pending-boundary` | 422 | pdf-adapter-pending-non-persistent | owasp-file-upload, supabase-edge-functions, nist-ai-rmf, ada-ai-hiring-guidance | The server validated the upload boundary without storing the file, but PDF/DOC/DOCX extraction is adapter-pending. Export to text or deploy a dedicated parser with malware-scan and deletion evidence before selling this workflow. |
| pass | `unsupported-file-rejection` | 415 | unsupported-file-rejected-non-persistent | owasp-file-upload, supabase-edge-functions, nist-ai-rmf, ada-ai-hiring-guidance | The upload did not match the allowed resume extensions/signatures. Only txt, pdf, doc, and docx are accepted at this boundary. |
