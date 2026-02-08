import React from "react";
import { Search } from "lucide-react";
import { SearchInterface } from "./SearchInterface";

export default function SearchInterfacePremium({ onOccupationSelect }: { onOccupationSelect: (occupation: any) => void }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
      <div className="relative">
        <div className="px-1 pt-1 pb-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Search Occupations</h3>
        </div>
        <div>
          <SearchInterface onOccupationSelect={onOccupationSelect} />
        </div>
      </div>
    </div>
  );
}
