import { useQuery } from "@tanstack/react-query";
import adminClient from "../../api/adminClient.js";

export default function AdminDashboardHome() {
  const { data } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => (await adminClient.get("/admin/stats")).data,
  });

  if (!data) return <p className="text-ink/40">Loading…</p>;

  const cards = [
    { label: "Users", value: data.totalUsers },
    { label: "Providers", value: `${data.verifiedProviders}/${data.totalProviders} verified` },
    { label: "Bookings", value: data.totalBookings },
    { label: "Revenue", value: `₹${data.totalRevenue}` },
    { label: "Cancelled bookings", value: data.cancelledBookings },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-mist bg-surface p-5 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{c.label}</p>
            <p className="mt-2 font-mono text-2xl text-ink">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
