import React from "react";
import { Search } from "lucide-react";
import { SearchInterface } from "./SearchInterface";

export default function SearchInterfacePremium({ onOccupationSelect }: { onOccupationSelect: (occupation: any) => void }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 group-hover:border-blue-400 transition-colors duration-300">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-800">Search Occupations</h3>
        </div>
        <div className="p-4">
          <SearchInterface onOccupationSelect={onOccupationSelect} />
        </div>
      </div>
    </div>
  );
}
