import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import client from "../api/client.js";
import Stepper from "../components/Stepper.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BookingFlow() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const providerId = params.get("providerId");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState("self");
  const [patient, setPatient] = useState({ name: user?.name || "", age: "", phone: "" });
  const [collectionType, setCollectionType] = useState("center");
  const [address, setAddress] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const { data: testData } = useQuery({
    queryKey: ["test", slug],
    queryFn: async () => (await client.get(`/tests/${slug}`)).data,
  });

  const { data: slotData, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", slug, providerId],
    queryFn: async () => (await client.get(`/tests/${slug}/slots`, { params: { providerId } })).data.slots,
    enabled: !!providerId,
  });

  const { data: familyMembers } = useQuery({
    queryKey: ["family"],
    queryFn: async () => (await client.get("/family")).data.members,
    enabled: !!user,
  });

  const offer = testData?.offers.find((o) => o.provider.id === providerId);

  useEffect(() => {
    if (selectedMemberId === "self" && user) {
      setPatient((p) => ({ ...p, name: user.name }));
    } else {
      const m = familyMembers?.find((f) => f.id === selectedMemberId);
      if (m) setPatient((p) => ({ ...p, name: m.name, age: m.age || "" }));
    }
  }, [selectedMemberId, familyMembers, user]);

  const createBooking = useMutation({
    mutationFn: async ({ paymentOrderId, paymentId, paymentSignature }) =>
      (
        await client.post("/bookings", {
          providerId,
          testId: testData.test.id,
          slotId: selectedSlot.id,
          patientName: patient.name,
          patientAge: patient.age ? Number(patient.age) : undefined,
          patientPhone: patient.phone,
          familyMemberId: selectedMemberId !== "self" ? selectedMemberId : undefined,
          collectionType,
          address: collectionType === "home" ? address : undefined,
          paymentOrderId,
          paymentId,
          paymentSignature,
        })
      ).data.booking,
    onSuccess: (b) => {
      setBooking(b);
      setStep(5);
    },
    onError: (err) => setError(err.response?.data?.error || "Something went wrong. Please try another slot."),
  });

  const startPayment = async () => {
    setError("");
    setPaying(true);
    try {
      const { data: order } = await client.post("/payments/create-order", { providerId, testId: testData.test.id });

      if (!order.live) {
        // Dev mode: no gateway configured - auto-confirm.
        await createBooking.mutateAsync({ paymentOrderId: order.orderId });
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        setError("Couldn't load the payment gateway. Check your connection and try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: "MediFinder",
        description: testData.test.name,
        order_id: order.orderId,
        prefill: { name: patient.name, contact: patient.phone },
        theme: { color: "#0E6B63" },
        handler: async (response) => {
          await createBooking.mutateAsync({
            paymentOrderId: order.orderId,
            paymentId: response.razorpay_payment_id,
            paymentSignature: response.razorpay_signature,
          });
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (!user) {
    navigate("/login", { state: { from: `/book/${slug}?providerId=${providerId}` } });
    return null;
  }

  if (!testData || !offer) {
    return <div className="py-24 text-center text-ink/40">Loading…</div>;
  }

  const isSlotExpired = (slot) => {
    const now = new Date();
    const [year, month, day] = slot.date.split("-").map(Number);
    const [hours, minutes] = slot.time.split(":").map(Number);
    const slotDateTime = new Date(year, month - 1, day, hours, minutes);
  
    return slotDateTime < now;
  };

  const groupedByDate = (slotData || []).reduce((acc, s) => {
    (acc[s.date] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-wide text-teal">{offer.provider.name}</p>
      <h1 className="mt-1 font-display text-2xl font-medium text-ink">{testData.test.name}</h1>

      <div className="mt-8">
        <Stepper current={step} />
      </div>

      {step === 2 && (
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Choose a date & slot</h2>
          {slotsLoading && <p className="mt-4 text-ink/50">Loading availability…</p>}
          <div className="mt-4 space-y-6">
            {Object.entries(groupedByDate).map(([date, slots]) => (
              <div key={date}>
                <p className="mb-2 text-sm font-medium text-ink/70">
                  {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
  <button
    key={s.id}
    disabled={!s.available || isSlotExpired(s)}
    onClick={() => setSelectedSlot(s)}
    className={`rounded-full border px-4 py-2 text-sm font-mono transition ${
      (!s.available || isSlotExpired(s))
        ? "cursor-not-allowed border-mist text-ink/25 line-through"
        : selectedSlot?.id === s.id
        ? "border-teal bg-teal text-paper"
        : "border-mist text-ink/70 hover:border-teal"
    }`}
  >
    {s.time}
  </button>
))}
                </div>
              </div>
            ))}
          </div>
          <button
            disabled={!selectedSlot}
            onClick={() => setStep(3)}
            className="mt-8 w-full rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(4);
          }}
          className="space-y-4"
        >
          <h2 className="font-display text-lg font-medium text-ink">Who is this for?</h2>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
          >
            <option value="self">Myself ({user.name})</option>
            {(familyMembers || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.relation})
              </option>
            ))}
          </select>

          <Field label="Full name">
            <input
              required
              value={patient.name}
              onChange={(e) => setPatient({ ...patient, name: e.target.value })}
              className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Age">
              <input
                type="number"
                min="0"
                value={patient.age}
                onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                minLength={10}
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
              />
            </Field>
          </div>

          {offer.provider.homeCollection && (
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/40">Where should we do this?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectionType("center")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    collectionType === "center" ? "border-teal bg-teal-light text-teal-deep" : "border-mist text-ink/60"
                  }`}
                >
                  Visit the center
                </button>
                <button
                  type="button"
                  onClick={() => setCollectionType("home")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    collectionType === "home" ? "border-teal bg-teal-light text-teal-deep" : "border-mist text-ink/60"
                  }`}
                >
                  Home sample collection
                </button>
              </div>
              {collectionType === "home" && (
                <textarea
                  required
                  placeholder="Full address for the technician to visit"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
                />
              )}
            </div>
          )}

          <button type="submit" className="mt-4 w-full rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-deep">
            Continue to payment
          </button>
        </form>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Payment</h2>
          <div className="mt-4 rounded-xl2 border border-mist bg-surface p-5">
            <div className="flex justify-between text-sm text-ink/60">
              <span>{testData.test.name}</span>
              <span className="font-mono">₹{offer.price}</span>
            </div>
            {collectionType === "home" && (
              <div className="flex justify-between text-sm text-ink/60">
                <span>Home sample collection</span>
                <span className="font-mono">Included</span>
              </div>
            )}
            <div className="mt-3 border-t border-dashed border-mist pt-3 flex justify-between font-medium text-ink">
              <span>Total</span>
              <span className="font-mono">₹{offer.price}</span>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-coral">{error}</p>}
          <button
            onClick={startPayment}
            disabled={paying || createBooking.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3 font-medium text-paper transition hover:bg-coral-deep disabled:opacity-60"
          >
            {(paying || createBooking.isPending) && <Loader2 size={16} className="animate-spin" />}
            Pay ₹{offer.price}
          </button>
        </div>
      )}

      {step === 5 && booking && (
        <div className="rounded-xl2 border border-mist bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto text-teal" size={40} />
          <h2 className="mt-4 font-display text-xl font-medium text-ink">Booking confirmed</h2>
          <p className="mt-2 text-sm text-ink/60">
            {booking.testName} at {booking.providerName} on{" "}
            {new Date(`${booking.slot.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {booking.slot.time}
          </p>
          {booking.technician && (
            <p className="mt-2 text-sm text-ink/60">
              {booking.technician.name} will visit for sample collection.
            </p>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-full bg-teal px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-deep"
          >
            View my bookings
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/40">{label}</span>
      {children}
    </label>
  );
}
