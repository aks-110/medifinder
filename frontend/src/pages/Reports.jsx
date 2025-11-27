import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import client from "../api/client.js";

export default function Reports() {
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await client.get("/reports")).data.reports,
  });

  const download = async (report) => {
    setDownloadingId(report.bookingId);
    try {
      const res = await client.get(`/reports/${report.bookingId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.fileName || "report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-medium text-ink">Reports center</h1>
      <p className="mt-1 text-sm text-ink/60">Every report your provider has uploaded, in one place.</p>

      <div className="mt-8 space-y-3">
        {isLoading && <p className="text-ink/40">Loading…</p>}
        {(data || []).map((r) => (
          <div key={r.bookingId} className="flex items-center justify-between rounded-xl2 border border-mist bg-surface p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-light text-teal-deep">
                <FileText size={18} />
              </span>
              <div>
                <p className="font-medium text-ink">{r.testName}</p>
                <p className="text-xs text-ink/50">
                  {r.providerName} · {r.category} · {new Date(`${r.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => download(r)}
              disabled={downloadingId === r.bookingId}
              className="flex items-center gap-1.5 rounded-full border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-teal hover:text-teal disabled:opacity-50"
            >
              <Download size={14} /> {downloadingId === r.bookingId ? "Downloading…" : "Download"}
            </button>
          </div>
        ))}
        {!isLoading && data?.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-mist p-8 text-center text-ink/50">
            No reports yet — they'll show up here once a provider marks your test complete.
          </p>
        )}
      </div>
    </div>
  );
}
