export function AdminPageHeader({
  tag,
  title,
  sub,
  action,
}: {
  tag: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <div className="stencil text-xs mb-1">{tag}</div>
        <h1 className="text-3xl">{title}</h1>
        {sub && <p className="text-sm text-(--color-stencil) mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
