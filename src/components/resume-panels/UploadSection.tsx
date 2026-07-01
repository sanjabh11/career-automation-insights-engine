import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, ShieldCheck, FileWarning } from 'lucide-react';
import { REPORT_TRUST_NOTICES } from '@/lib/reportProvenance';
import type { ResumeServerParserReceipt } from '@/components/resume-ui';

export interface UploadSectionProps {
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  uploading: boolean;
  analyzing: boolean;
  filename: string | null;
  fileWarning: string | null;
  serverParserReceipt: ResumeServerParserReceipt | null;
  resumeText: string;
  setResumeText: (v: string) => void;
  setFileWarning: (v: string | null) => void;
  setServerParserReceipt: (v: ResumeServerParserReceipt | null) => void;
  analyzeResume: (text: string, filename: string) => void;
  RESUME_SERVER_PARSER_EVIDENCE_CARD_ID: string;
  RESUME_SERVER_PARSER_SOURCE_IDS: string[];
}

export function UploadSection(props: UploadSectionProps) {
  const {
    getRootProps, getInputProps, isDragActive, uploading, analyzing,
    filename, fileWarning, serverParserReceipt,
    resumeText, setResumeText, setFileWarning, setServerParserReceipt,
    analyzeResume, RESUME_SERVER_PARSER_EVIDENCE_CARD_ID, RESUME_SERVER_PARSER_SOURCE_IDS,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Automation Risk Analyzer
        </CardTitle>
        <CardDescription>
          Upload your resume to identify automation-prone phrases and get strategic rewrites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Reliable path today: paste text or upload .txt. When Supabase is configured, uploads are first sent through a server-side parser boundary that validates type, size, and file signature without storing the raw file. PDF/DOCX extraction remains adapter-pending until a dedicated parser and deletion evidence are deployed. Guest scans are not stored; signed-in scans may create a saved analysis record that can be deleted below. {REPORT_TRUST_NOTICES[1]}
          </AlertDescription>
        </Alert>

        <div
          {...getRootProps({ role: 'button', 'aria-label': 'Upload resume file' })}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-gray-300 hover:border-[var(--accent-primary)]'
            } ${(uploading || analyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps({ 'aria-hidden': true, tabIndex: -1 })} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop your resume here...</p>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
              <p>Uploading...</p>
            </div>
          ) : analyzing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
              <p>Analyzing with AI...</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">Drag & drop your resume here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">Best support: .txt. PDF/DOC/DOCX may require paste fallback.</p>
            </>
          )}
        </div>

        {filename && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>{filename}</strong> uploaded successfully
            </AlertDescription>
          </Alert>
        )}

        {fileWarning && (
          <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertDescription>{fileWarning}</AlertDescription>
          </Alert>
        )}

        {serverParserReceipt && (
          <Alert data-resume-server-parser-receipt="true" data-resume-server-parser-evidence-id={RESUME_SERVER_PARSER_EVIDENCE_CARD_ID}>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Server parser receipt:</strong> {serverParserReceipt.receiptId.slice(0, 8)} for {serverParserReceipt.detectedFileKind.toUpperCase()} upload.
                </p>
                <p>
                  Raw file stored: {serverParserReceipt.rawFileStored ? 'yes' : 'no'}; raw resume text stored: {serverParserReceipt.rawResumeTextStored ? 'yes' : 'no'}; temp deletion status: {serverParserReceipt.tempFileDeletionStatus}.
                </p>
                <p>
                  <strong>Sources:</strong> {(serverParserReceipt.sourceIds.length > 0 ? serverParserReceipt.sourceIds : RESUME_SERVER_PARSER_SOURCE_IDS).join(', ')}. <strong>Does not prove:</strong> {serverParserReceipt.doesNotProve}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Textarea
            value={resumeText}
            onChange={(event) => {
              setResumeText(event.target.value);
              setFileWarning(null);
              setServerParserReceipt(null);
            }}
            placeholder="Paste resume text here if PDF/DOCX extraction is blocked or incomplete..."
            rows={8}
            disabled={uploading || analyzing}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => analyzeResume(resumeText, filename || 'pasted-resume.txt')}
            disabled={uploading || analyzing || resumeText.trim().length < 200}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Pasted Text'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
