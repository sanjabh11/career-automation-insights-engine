
/**
 * PDF export functionality for career analyses
 */

export interface CareerAnalysisData {
  title: string;
  code: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  categoryBreakdown: {
    tasks: { apo: number; confidence: string };
    knowledge: { apo: number; confidence: string };
    skills: { apo: number; confidence: string };
    abilities: { apo: number; confidence: string };
    technologies: { apo: number; confidence: string };
  };
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
}

export const exportAnalysisToPDF = async (analyses: CareerAnalysisData[], filename?: string) => {
  try {
    // Create HTML content for PDF generation
    const htmlContent = generatePDFHTML(analyses);
    
    // Use browser's print functionality for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-print after content loads
    printWindow.onload = () => {
      printWindow.print();
      // Close window after printing (user can cancel)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };

  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
};

const generatePDFHTML = (analyses: CareerAnalysisData[]): string => {
  const currentDate = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>APO Career Analysis Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .analysis {
          margin-bottom: 40px;
          break-inside: avoid;
        }
        .title {
          color: #2563eb;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .apo-score {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .category-item {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          border-left: 4px solid #2563eb;
        }
        .insights {
          margin-top: 20px;
        }
        .insight-section {
          margin-bottom: 15px;
        }
        .insight-title {
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .insight-list {
          list-style-type: disc;
          margin-left: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
        @media print {
          body { margin: 0; }
          .analysis { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>APO Career Analysis Report</h1>
        <p>Generated on ${currentDate}</p>
        <p>Automation Potential Overview for ${analyses.length} Career${analyses.length > 1 ? 's' : ''}</p>
      </div>
      
      ${analyses.map(analysis => `
        <div class="analysis">
          <h2 class="title">${analysis.title}</h2>
          <p><strong>O*NET Code:</strong> ${analysis.code}</p>
          
          <div class="apo-score">
            <h3>Overall Automation Potential: ${(analysis.overallAPO * 100).toFixed(1)}%</h3>
            <p><strong>Confidence:</strong> ${analysis.confidence}</p>
            <p><strong>Timeline:</strong> ${analysis.timeline}</p>
          </div>
          
          <h3>Category Breakdown</h3>
          <div class="category-grid">
            <div class="category-item">
              <strong>Tasks:</strong> ${(analysis.categoryBreakdown.tasks.apo * 100).toFixed(1)}%
              <br><small>Confidence: ${analysis.categoryBreakdown.tasks.confidence}</small>
            </div>
            <div class="category-item">
              <strong>Knowledge:</strong> ${(analysis.categoryBreakdown.knowledge.apo * 100).toFixed(1)}%
              <br><small>Confidence: ${analysis.categoryBreakdown.knowledge.confidence}</small>
            </div>
            <div class="category-item">
              <strong>Skills:</strong> ${(analysis.categoryBreakdown.skills.apo * 100).toFixed(1)}%
              <br><small>Confidence: ${analysis.categoryBreakdown.skills.confidence}</small>
            </div>
            <div class="category-item">
              <strong>Abilities:</strong> ${(analysis.categoryBreakdown.abilities.apo * 100).toFixed(1)}%
              <br><small>Confidence: ${analysis.categoryBreakdown.abilities.confidence}</small>
            </div>
            <div class="category-item">
              <strong>Technologies:</strong> ${(analysis.categoryBreakdown.technologies.apo * 100).toFixed(1)}%
              <br><small>Confidence: ${analysis.categoryBreakdown.technologies.confidence}</small>
            </div>
          </div>
          
          <div class="insights">
            <h3>Key Insights</h3>
            
            <div class="insight-section">
              <div class="insight-title">Primary Opportunities:</div>
              <ul class="insight-list">
                ${analysis.insights.primary_opportunities.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            
            <div class="insight-section">
              <div class="insight-title">Main Challenges:</div>
              <ul class="insight-list">
                ${analysis.insights.main_challenges.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            
            <div class="insight-section">
              <div class="insight-title">Automation Drivers:</div>
              <ul class="insight-list">
                ${analysis.insights.automation_drivers.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            
            <div class="insight-section">
              <div class="insight-title">Barriers to Automation:</div>
              <ul class="insight-list">
                ${analysis.insights.barriers.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `).join('')}
      
      <div class="footer">
        <p>This report was generated by the APO Dashboard</p>
        <p>Data sourced from O*NET and analyzed using advanced AI algorithms</p>
      </div>
    </body>
    </html>
  `;
};
