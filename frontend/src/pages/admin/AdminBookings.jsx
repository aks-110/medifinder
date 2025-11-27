import { useQuery } from "@tanstack/react-query";
import adminClient from "../../api/adminClient.js";

export default function AdminBookings() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminBookings"],
    queryFn: async () => (await adminClient.get("/admin/bookings")).data.bookings,
  });

  if (isLoading) return <p className="text-ink/40">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">All bookings</h1>
      <div className="mt-6 overflow-x-auto rounded-xl2 border border-mist bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-mist text-xs uppercase tracking-wide text-ink/40">
            <tr>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="border-b border-mist/60 last:border-0">
                <td className="px-4 py-3">{b.testName}</td>
                <td className="px-4 py-3">{b.providerName}</td>
                <td className="px-4 py-3">{b.patient.name}</td>
                <td className="px-4 py-3">{b.slot.date}</td>
                <td className="px-4 py-3 font-mono">₹{b.amount}</td>
                <td className="px-4 py-3 capitalize">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
