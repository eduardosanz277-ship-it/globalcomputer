type Props = {
  title: string;
  description?: string;
};

export function AdminPlaceholder({
  title,
  description = "Esta sección está en construcción.",
}: Props) {
  return (
    <div className="w-full space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
