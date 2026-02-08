import React from "react";
import { HelpCircle, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { helpContent } from "@/content/help/helpContent";

type Variant = "tip" | "help";

export function HelpTrigger({ entryKey, variant = "help", label }: { entryKey: string; variant?: Variant; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const entry = helpContent[entryKey];
  if (!entry) return null;

  const Icon = variant === "tip" ? Lightbulb : HelpCircle;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label || entry.title}
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-[220px]">
            {entry.short}
          </div>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{entry.title}</DialogTitle>
            {entry.medium && <DialogDescription>{entry.medium}</DialogDescription>}
          </DialogHeader>
          {!entry.medium && (
            <div className="text-sm text-muted-foreground">
              {entry.short}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
