export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Chrysalis Incentive Dashboard
        </h1>
        <p className="text-xl text-gray-400">
          Phase 2: UI coming soon. Backend sync is live.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <StatusBadge label="Sync Engine" />
          <StatusBadge label="Rules Engine" />
          <StatusBadge label="Ledger" />
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </span>
  );
}
