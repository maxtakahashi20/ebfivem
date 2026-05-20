import { useEffect, useState } from "react";
import type { AdminView } from "@/config/admin-nav";
import { getModuloForm, type ModuloFormField } from "@/config/admin-module-forms";
import { PDF_RESTRITO_VIEWS } from "@/config/admin-modules-db";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AdminFormPdf = {
  base64: string;
  filename: string;
  mime: string;
};

export type AdminFormSubmit = (
  valores: Record<string, string>,
  pdf: AdminFormPdf | null,
) => void;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: AdminView;
  title: string;
  saving: boolean;
  onSubmit: AdminFormSubmit;
};

export function AdminModuleFormDialog({
  open,
  onOpenChange,
  view,
  title,
  saving,
  onSubmit,
}: Props) {
  const spec = getModuloForm(view);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const allowsPdf = PDF_RESTRITO_VIEWS.has(view);

  useEffect(() => {
    if (open) {
      setValores({});
      setPdfFile(null);
    }
  }, [open, view]);

  if (!spec) return null;

  const setField = (key: string, value: string) => {
    setValores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let pdf: AdminFormPdf | null = null;
    if (pdfFile) {
      pdf = {
        base64: await fileToBase64(pdfFile),
        filename: pdfFile.name,
        mime: pdfFile.type || "application/pdf",
      };
    }
    onSubmit(valores, pdf);
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
              <FieldInput
                key={field.key}
                field={field}
                value={valores[field.key] ?? ""}
                onChange={setField}
              />
            ))}
            {allowsPdf && (
              <div className="grid gap-1.5">
                <Label htmlFor="pdf-anexo" className="stencil text-[10px]">
                  Anexar PDF (opcional · até 25 MB)
                </Label>
                <Input
                  id="pdf-anexo"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  className="font-mono text-xs bg-transparent"
                />
                {pdfFile && (
                  <p className="text-[10px] font-mono text-(--color-stencil)">
                    {pdfFile.name} · {(pdfFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              className="btn-ghost-olive text-xs"
              onClick={() => onOpenChange(false)}
            >
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo."));
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("Resultado inesperado do FileReader."));
    };
    reader.readAsDataURL(file);
  });
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
