import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import providerClient from "../../api/providerClient.js";

export default function ProviderTests() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState({});
  const [addingTestId, setAddingTestId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["providerTests"],
    queryFn: async () => (await providerClient.get("/provider/tests")).data,
  });

  const save = useMutation({
    mutationFn: async ({ testId, price, reportTimeHours }) =>
      providerClient.put(`/provider/tests/${testId}`, { price: Number(price), reportTimeHours: Number(reportTimeHours) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providerTests"] }),
  });

  const remove = useMutation({
    mutationFn: async (testId) => providerClient.delete(`/provider/tests/${testId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["providerTests"] }),
  });

  if (isLoading) return <p className="text-ink/40">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Tests & pricing</h1>

      <div className="mt-6 space-y-3">
        {data.offered.map((t) => {
          const edit = edits[t.testId] || { price: t.price, reportTimeHours: t.reportTimeHours };
          return (
            <div key={t.testId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-mist bg-surface p-4">
              <p className="font-medium text-ink">{t.testName}</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-ink/50">₹</label>
                <input
                  type="number"
                  value={edit.price}
                  onChange={(e) => setEdits({ ...edits, [t.testId]: { ...edit, price: e.target.value } })}
                  className="w-24 rounded-lg border border-mist px-3 py-1.5 text-sm focus:border-teal focus:outline-none"
                />
                <label className="text-xs text-ink/50">report (hrs)</label>
                <input
                  type="number"
                  value={edit.reportTimeHours}
                  onChange={(e) => setEdits({ ...edits, [t.testId]: { ...edit, reportTimeHours: e.target.value } })}
                  className="w-20 rounded-lg border border-mist px-3 py-1.5 text-sm focus:border-teal focus:outline-none"
                />
                <button
                  onClick={() => save.mutate({ testId: t.testId, ...edit })}
                  className="rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-paper hover:bg-teal-deep"
                >
                  Save
                </button>
                <button
                  onClick={() => remove.mutate(t.testId)}
                  className="rounded-full border border-mist px-3 py-1.5 text-xs text-ink/50 hover:border-coral hover:text-coral"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {data.notOffered.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-dashed border-mist p-5">
          <p className="text-sm font-medium text-ink">Offer a new test</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={addingTestId}
              onChange={(e) => setAddingTestId(e.target.value)}
              className="rounded-lg border border-mist px-4 py-2 text-sm focus:border-teal focus:outline-none"
            >
              <option value="">Select a test…</option>
              {data.notOffered.map((t) => (
                <option key={t.testId} value={t.testId}>
                  {t.testName}
                </option>
              ))}
            </select>
            <button
              disabled={!addingTestId}
              onClick={() => {
                save.mutate({ testId: addingTestId, price: 500, reportTimeHours: 24 });
                setAddingTestId("");
              }}
              className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-deep disabled:opacity-50"
            >
              Add with default price ₹500
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
