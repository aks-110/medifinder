import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, X, Truck, Star } from "lucide-react";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const TABS = ["Upcoming", "Past"];
const COLLECTION_LABELS = {
  technician_assigned: "Technician assigned",
  collected: "Sample collected",
  processing: "Processing at lab",
  report_ready: "Report ready",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Upcoming");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => (await client.get("/bookings/me")).data,
  });

  const cancel = useMutation({
    mutationFn: async (id) => (await client.post(`/bookings/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myBookings"] }),
  });

  const list = tab === "Upcoming" ? data?.upcoming : data?.past;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-medium text-ink">Hi {user.name.split(" ")[0]}, here's your care overview</h1>

      <div className="mt-8 flex gap-2 border-b border-mist">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t ? "border-teal text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
          >
            {t} appointments
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && <p className="text-ink/40">Loading…</p>}

        {!isLoading && list?.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-mist p-8 text-center text-ink/50">
            No {tab.toLowerCase()} appointments yet.
          </p>
        )}

        {list?.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-xl2 border border-mist bg-surface p-5 shadow-soft">
            <div>
              <p className="font-display text-base font-medium text-ink">{b.testName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {b.providerName}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarClock size={13} />
                  {new Date(`${b.slot.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.slot.time}
                </span>
              </div>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  b.status === "cancelled" ? "bg-coral/10 text-coral" : "bg-teal-light text-teal-deep"
                }`}
              >
                {b.status}
              </span>
              {b.collectionType === "home" && b.collectionStatus && (
                <span className="ml-2 mt-2 inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-0.5 text-xs font-medium text-ink/60">
                  <Truck size={11} /> {COLLECTION_LABELS[b.collectionStatus] || b.collectionStatus}
                </span>
              )}
              {tab === "Past" && b.status === "completed" && (
                <Link
                  to={`/providers/${b.providerId}`}
                  className="ml-2 mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal hover:underline"
                >
                  <Star size={11} /> Leave a review
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <p className="font-mono text-ink">₹{b.amount}</p>
              {tab === "Upcoming" && b.status !== "cancelled" && (
                <button
                  onClick={() => cancel.mutate(b.id)}
                  className="flex items-center gap-1 rounded-full border border-mist px-3 py-1.5 text-xs text-ink/60 transition hover:border-coral hover:text-coral"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
