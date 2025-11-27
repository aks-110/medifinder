import { useQuery } from "@tanstack/react-query";
import providerClient from "../../api/providerClient.js";

export default function ProviderDashboardHome() {
  const { data } = useQuery({
    queryKey: ["providerMe"],
    queryFn: async () => (await providerClient.get("/provider/me")).data,
  });

  if (!data) return <p className="text-ink/40">Loading…</p>;
  const { stats, provider } = data;

  const cards = [
    { label: "Total bookings", value: stats.totalBookings },
    { label: "Today's bookings", value: stats.todayBookings },
    { label: "Revenue", value: `₹${stats.revenue}` },
    { label: "Pending home collections", value: stats.pendingCollections },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-mist bg-surface p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{c.label}</p>
            <p className="mt-2 font-mono text-2xl text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl2 border border-mist bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">Verification status</p>
        <p className="mt-2 text-sm text-ink/70">
          {provider.verified ? "Your listing is verified." : "Your listing is pending admin verification."}
        </p>
      </div>
    </div>
  );
}
