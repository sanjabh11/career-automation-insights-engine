import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface Props { title: string; children: React.ReactNode }
export function HelpOverlay({ title, children }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4" /> Help
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="p-5 max-w-xl w-[92vw] bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{title}</h3>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              {children}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
