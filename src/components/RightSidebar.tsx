import React from 'react';
import { SidebarContent } from './SidebarContent';
import { SelectedOccupation } from './APODashboard';

interface RightSidebarProps {
    selectedOccupation: SelectedOccupation | null;
    onAddToList: () => void;
    isAlreadySelected: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
    selectedOccupation,
    onAddToList,
    isAlreadySelected,
}) => {
    return (
        <div className="hidden 3xl:block">
            <SidebarContent
                selectedOccupation={selectedOccupation}
                onAddToList={onAddToList}
                isAlreadySelected={isAlreadySelected}
            />
        </div>
    );
};
