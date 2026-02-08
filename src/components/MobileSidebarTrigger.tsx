import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./SidebarContent";
import { SelectedOccupation } from './APODashboard';
import { PanelRight } from "lucide-react";

interface MobileSidebarTriggerProps {
    selectedOccupation: SelectedOccupation | null;
    onAddToList: () => void;
    isAlreadySelected: boolean;
}

export const MobileSidebarTrigger: React.FC<MobileSidebarTriggerProps> = ({
    selectedOccupation,
    onAddToList,
    isAlreadySelected,
}) => {
    if (!selectedOccupation) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 3xl:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="lg" className="rounded-full shadow-xl h-14 w-14 p-0 bg-primary hover:bg-primary/90 text-white">
                        <PanelRight className="h-6 w-6" />
                        <span className="sr-only">View Insights</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
                    <div className="mt-6">
                        <SidebarContent
                            selectedOccupation={selectedOccupation}
                            onAddToList={onAddToList}
                            isAlreadySelected={isAlreadySelected}
                            mobile={true}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};
