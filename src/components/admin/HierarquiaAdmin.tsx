import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/input";
import {
  listarHierarquia,
  removerItemHierarquia,
  salvarItemHierarquia,
  type ItemHierarquia,
} from "@/lib/hierarquia.functions";
import { getDiscordSessionToken } from "@/lib/painel-auth-storage";

const LBL =
  "flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground [&_input]:font-body [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-sm [&_input]:text-foreground [&_input]:bg-background";

const VAZIO = { posto: "", nome: "", funcao: "", ordem: "0" };

/** Desenvolvedor mantém a cadeia de comando mostrada em /hierarquia. */
export function HierarquiaAdmin() {
  const listar = useServerFn(listarHierarquia);
  const salvar = useServerFn(salvarItemHierarquia);
  const remover = useServerFn(removerItemHierarquia);
  const [itens, setItens] = useState<ItemHierarquia[]>([]);
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    listar().then(setItens).catch((e: Error) => toast.error(e.message));
  }, [listar]);
  useEffect(carregar, [carregar]);

  const limpar = () => {
    setEditando(null);
    setForm(VAZIO);
  };
  // Sugere a próxima ordem ao adicionar.
  useEffect(() => {
    if (!editando) setForm((f) => ({ ...f, ordem: String((itens.at(-1)?.ordem ?? -1) + 1) }));
  }, [itens, editando]);

  const onSalvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await salvar({
        data: { session: getDiscordSessionToken(), id: editando ?? undefined, ...form, ordem: Number(form.ordem) },
      });
      toast.success(editando ? "Hierarquia atualizada" : "Adicionado à hierarquia");
      limpar();
      carregar();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const onRemover = async (item: ItemHierarquia) => {
    if (!confirm(`Remover ${item.posto}${item.nome ? ` · ${item.nome}` : ""} da hierarquia?`)) return;
    try {
      await remover({ data: { session: getDiscordSessionToken(), id: item.id } });
      toast.success("Removido");
      if (editando === item.id) limpar();
      carregar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const campo = (k: keyof typeof VAZIO) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <div>
      <AdminPageHeader
        tag="DESENVOLVIMENTO"
        title="Hierarquia"
        sub="Cadeia de comando exibida na página pública /hierarquia. Ordem menor aparece mais alto."
      />

      <form onSubmit={onSalvar} className="mb-6 grid gap-4 border border-border bg-card p-5 md:grid-cols-[1fr_1fr_1fr_100px_auto] md:items-end">
        <label className={LBL}>
          Posto / cargo *
          <Input {...campo("posto")} placeholder="General de Exército" required maxLength={80} />
        </label>
        <label className={LBL}>
          Nome
          <Input {...campo("nome")} placeholder="Arthur Vieira" maxLength={120} />
        </label>
        <label className={LBL}>
          Função
          <Input {...campo("funcao")} placeholder="Comandante" maxLength={160} />
        </label>
        <label className={LBL}>
          Ordem
          <Input {...campo("ordem")} type="number" min={0} max={9999} required />
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="btn-olive inline-flex h-10 items-center gap-2">
            <Plus className="size-4" /> {editando ? "Salvar" : "Adicionar"}
          </button>
          {editando && (
            <button type="button" onClick={limpar} className="inline-flex h-10 items-center border border-border px-3 text-muted-foreground hover:text-foreground" aria-label="Cancelar edição">
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      <div className="border border-border bg-card">
        {itens.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhum posto cadastrado ainda.</p>}
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="w-10 font-mono text-xs text-muted-foreground">{item.ordem}</span>
            <span className="w-56 shrink-0 font-mono text-xs uppercase tracking-wider text-(--color-olive-bright)">{item.posto}</span>
            <span className="flex-1 text-sm text-foreground">{item.nome ?? "—"}</span>
            <span className="hidden flex-1 text-sm text-muted-foreground md:block">{item.funcao ?? ""}</span>
            <button
              type="button"
              aria-label="Editar"
              className="p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditando(item.id);
                setForm({ posto: item.posto, nome: item.nome ?? "", funcao: item.funcao ?? "", ordem: String(item.ordem) });
              }}
            >
              <Pencil className="size-4" />
            </button>
            <button type="button" aria-label="Remover" className="p-1.5 text-(--color-destructive)" onClick={() => void onRemover(item)}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
