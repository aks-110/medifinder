import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import adminClient from "../../api/adminClient.js";

export default function AdminProviders() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["adminProviders"],
    queryFn: async () => (await adminClient.get("/admin/providers")).data.providers,
  });

  const toggleVerify = useMutation({
    mutationFn: async (id) => adminClient.patch(`/admin/providers/${id}/verify`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminProviders"] }),
  });

  if (isLoading) return <p className="text-ink/40">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Provider verification</h1>
      <div className="mt-6 space-y-3">
        {data.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl2 border border-mist bg-surface p-4">
            <div>
              <p className="font-medium text-ink">{p.name}</p>
              <p className="text-xs text-ink/50">{p.type} · {p.address}</p>
            </div>
            <button
              onClick={() => toggleVerify.mutate(p.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition ${
                p.verified ? "bg-teal-light text-teal-deep" : "border border-mist text-ink/50 hover:border-teal hover:text-teal"
              }`}
            >
              {p.verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              {p.verified ? "Verified" : "Unverified"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
