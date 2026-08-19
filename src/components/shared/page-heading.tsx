export function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex min-w-0 max-w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground md:text-base">{description}</p></div>{action}</div>;
}
