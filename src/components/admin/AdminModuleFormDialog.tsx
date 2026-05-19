import { useEffect, useState } from "react";
import type { AdminView } from "@/config/admin-nav";
import { getModuloForm, type ModuloFormField } from "@/config/admin-module-forms";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: AdminView;
  title: string;
  saving: boolean;
  onSubmit: (valores: Record<string, string>) => void;
};

export function AdminModuleFormDialog({ open, onOpenChange, view, title, saving, onSubmit }: Props) {
  const spec = getModuloForm(view);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setValores({});
  }, [open, view]);

  if (!spec) return null;

  const setField = (key: string, value: string) => {
    setValores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(valores);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="field-paper border-(--color-border) sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-lg">{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {spec.fields.map((field) => (
              <FieldInput key={field.key} field={field} value={valores[field.key] ?? ""} onChange={setField} />
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" className="btn-ghost-olive text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-olive text-xs" disabled={saving}>
              {saving ? "Salvando…" : "▸ Confirmar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ModuloFormField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.key} className="stencil text-[10px]">
        {field.label}
        {field.required && " *"}
      </Label>
      <Input
        id={field.key}
        type={field.type ?? "text"}
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="font-mono text-sm bg-transparent"
      />
    </div>
  );
}
