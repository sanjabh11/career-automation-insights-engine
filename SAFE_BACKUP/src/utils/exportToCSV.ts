
import { SelectedOccupation } from "@/components/APODashboard";

export const exportToCSV = (occupations: SelectedOccupation[]) => {
  if (!occupations.length) return;
  const fields = [
    "Code", "Title", "Overall APO (%)", "Confidence", "Timeline",
    "Tasks APO", "Knowledge APO", "Skills APO", "Abilities APO", "Technologies APO"
  ];
  let csv = fields.join(",") + "\n";
  for (const occ of occupations) {
    csv += [
      `"${occ.code}"`,
      `"${occ.title.replace(/"/g, '""')}"`,
      `${occ.overallAPO?.toFixed(1) ?? ""}`,
      `"${occ.confidence}"`,
      `"${occ.timeline}"`,
      `${occ.categoryBreakdown?.tasks?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.knowledge?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.skills?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.abilities?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.technologies?.apo?.toFixed(1) ?? ""}`,
    ].join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "APO_Career_Export.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
};
