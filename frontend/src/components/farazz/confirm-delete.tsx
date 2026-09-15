import { useState } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmDelete({
  title = "Delete record",
  description = "This action cannot be undone. The record will be permanently removed from the demo dataset.",
  confirmLabel = "Delete",
  onConfirm,
  children,
  triggerLabel,
}: {
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  /** Icon-only button when set (renders trigger as a button with Trash2 icon). */
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const handle = () => {
    onConfirm();
    setOpen(false);
    toast.success(confirmLabel !== "Delete" ? confirmLabel : "Record deleted.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={triggerLabel ?? title}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handle}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}