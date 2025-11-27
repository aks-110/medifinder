const STEPS = ["Provider", "Date & slot", "Patient details", "Payment", "Confirmation"];

export default function Stepper({ current }) {
  return (
    <ol className="mb-10 flex items-center">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-medium transition ${
                  done
                    ? "bg-teal text-paper"
                    : active
                    ? "border-2 border-teal text-teal"
                    : "border border-mist text-ink/30"
                }`}
              >
                {step}
              </div>
              <span className={`hidden text-xs sm:block ${active ? "text-ink font-medium" : "text-ink/40"}`}>{label}</span>
            </div>
            {step !== STEPS.length && (
              <div className={`mx-2 h-px flex-1 ${done ? "bg-teal" : "bg-mist"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
