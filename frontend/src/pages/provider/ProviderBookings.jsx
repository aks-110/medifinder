import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import providerClient from "../../api/providerClient.js";

const COLLECTION_STEPS = ["technician_assigned", "collected", "processing", "report_ready"];

export default function ProviderBookings() {
  const queryClient = useQueryClient();
  const fileInputs = useRef({});

  const { data, isLoading } = useQuery({
    queryKey: ["providerBookings"],
    queryFn: async () => (await providerClient.get("/provider/bookings")).data.bookings,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, payload }) => providerClient.post(`/provider/bookings/${id}/status`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providerBookings"] }),
  });

  const uploadReport = useMutation({
    mutationFn: async ({ id, file }) => {
      const form = new FormData();
      form.append("report", file);
      form.append("category", "Diagnostic Report");
      return providerClient.post(`/provider/bookings/${id}/report`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providerBookings"] }),
  });

  if (isLoading) return <p className="text-ink/40">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Bookings</h1>
      <div className="mt-6 space-y-4">
        {data.map((b) => {
          const nextCollectionStep = COLLECTION_STEPS[COLLECTION_STEPS.indexOf(b.collectionStatus) + 1];
          return (
            <div key={b.id} className="rounded-xl2 border border-mist bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{b.testName}</p>
                  <p className="text-xs text-ink/50">
                    {b.patient.name} · {b.slot.date} at {b.slot.time} · ₹{b.amount}
                  </p>
                  {b.collectionType === "home" && (
                    <p className="mt-1 text-xs text-ink/50">Home collection · {b.address}</p>
                  )}
                </div>
                <span className="rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-medium text-teal-deep">{b.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <button
                    onClick={() => updateStatus.mutate({ id: b.id, payload: { status: "cancelled" } })}
                    className="rounded-full border border-mist px-3 py-1.5 text-xs text-ink/60 hover:border-coral hover:text-coral"
                  >
                    Cancel
                  </button>
                )}

                {b.collectionType === "home" && nextCollectionStep && (
                  <button
                    onClick={() => updateStatus.mutate({ id: b.id, payload: { collectionStatus: nextCollectionStep } })}
                    className="rounded-full border border-mist px-3 py-1.5 text-xs text-ink/60 hover:border-teal hover:text-teal"
                  >
                    Mark: {nextCollectionStep.replace("_", " ")}
                  </button>
                )}

                {b.status !== "completed" && b.status !== "cancelled" && (
                  <>
                    <input
                      ref={(el) => (fileInputs.current[b.id] = el)}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && uploadReport.mutate({ id: b.id, file: e.target.files[0] })}
                    />
                    <button
                      onClick={() => fileInputs.current[b.id]?.click()}
                      className="rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-paper hover:bg-teal-deep"
                    >
                      Upload report & complete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {data.length === 0 && <p className="text-sm text-ink/50">No bookings yet.</p>}
      </div>
    </div>
  );
}
