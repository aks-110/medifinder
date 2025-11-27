import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import client from "../api/client.js";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await client.get("/notifications")).data,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id) => client.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unreadCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-ink/60 transition hover:bg-mist hover:text-ink"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-medium text-paper">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl2 border border-mist bg-surface shadow-card">
            <div className="border-b border-mist px-4 py-3">
              <p className="font-medium text-ink">Notifications</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(data?.notifications || []).length === 0 && (
                <p className="p-4 text-sm text-ink/50">Nothing yet.</p>
              )}
              {(data?.notifications || []).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={`block w-full border-b border-mist/60 px-4 py-3 text-left last:border-0 hover:bg-paper ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{n.body}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
