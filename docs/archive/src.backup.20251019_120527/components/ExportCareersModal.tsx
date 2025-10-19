
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileText, Table } from 'lucide-react';
import { exportToCSV } from '@/utils/exportToCSV';
import { exportAnalysisToPDF, CareerAnalysisData } from '@/utils/exportToPDF';
import { toast } from 'sonner';

interface ExportCareersModalProps {
  open: boolean;
  onClose: () => void;
  selectedJobs: any[];
}

export const ExportCareersModal: React.FC<ExportCareersModalProps> = ({
  open,
  onClose,
  selectedJobs
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (selectedJobs.length === 0) {
      toast.error('No careers selected for export');
      return;
    }

    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        await exportToCSV(selectedJobs);
        toast.success('CSV export completed successfully');
      } else if (exportFormat === 'pdf') {
        // Transform data for PDF export
        const pdfData: CareerAnalysisData[] = selectedJobs.map(job => ({
          title: job.title,
          code: job.code,
          overallAPO: job.overallAPO || 0,
          confidence: job.confidence || 'Medium',
          timeline: job.timeline || '5-10 years',
          categoryBreakdown: job.categoryBreakdown || {
            tasks: { apo: 0, confidence: 'Medium' },
            knowledge: { apo: 0, confidence: 'Medium' },
            skills: { apo: 0, confidence: 'Medium' },
            abilities: { apo: 0, confidence: 'Medium' },
            technologies: { apo: 0, confidence: 'Medium' }
          },
          insights: job.insights || {
            primary_opportunities: [],
            main_challenges: [],
            automation_drivers: [],
            barriers: []
          }
        }));
        
        await exportAnalysisToPDF(pdfData);
        toast.success('PDF export initiated - check your browser downloads');
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Career Analyses
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Select Export Format
            </Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as 'csv' | 'pdf')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="csv" id="csv" />
                <div className="flex items-center space-x-2 flex-1">
                  <Table className="h-4 w-4 text-green-600" />
                  <div>
                    <Label htmlFor="csv" className="font-medium cursor-pointer">
                      CSV Spreadsheet
                    </Label>
                    <p className="text-xs text-gray-500">
                      Compatible with Excel, Google Sheets
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="pdf" id="pdf" />
                <div className="flex items-center space-x-2 flex-1">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <Label htmlFor="pdf" className="font-medium cursor-pointer">
                      PDF Report
                    </Label>
                    <p className="text-xs text-gray-500">
                      Formatted report with insights
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedJobs.length}</strong> career{selectedJobs.length !== 1 ? 's' : ''} selected for export
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
