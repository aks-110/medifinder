import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MapPin, ShieldCheck, Home } from "lucide-react";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewForm, setReviewForm] = useState({ bookingId: "", rating: 5, comment: "" });

  const { data: provider } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => (await client.get(`/providers/${id}`)).data.provider,
  });

  const { data: reviewData } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await client.get(`/providers/${id}/reviews`)).data,
  });

  // Bookings with this provider that are completed and not yet reviewed -
  // these are the only ones eligible to leave a review for.
  const { data: myBookings } = useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => (await client.get("/bookings/me")).data,
    enabled: !!user,
  });

  const reviewableBookings = (myBookings?.past || []).filter(
    (b) => b.providerId === id && b.status === "completed" && !reviewData?.reviews.some((r) => r.bookingId === b.id && r.userId === user?.id)
  );

  const submitReview = useMutation({
    mutationFn: async () =>
      (await client.post(`/providers/${id}/reviews`, { ...reviewForm, rating: Number(reviewForm.rating) })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      setReviewForm({ bookingId: "", rating: 5, comment: "" });
    },
  });

  if (!provider) return <div className="py-24 text-center text-ink/40">Loading…</div>;

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${provider.lng - 0.01}%2C${provider.lat - 0.01}%2C${
    provider.lng + 0.01
  }%2C${provider.lat + 0.01}&marker=${provider.lat}%2C${provider.lng}&layer=mapnik`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start gap-4">
        <img src={provider.imageUrl} alt="" className="h-20 w-20 rounded-xl2 object-cover" />
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">{provider.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-gold text-gold" /> {provider.rating} ({provider.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {provider.address}
            </span>
            {provider.verified && (
              <span className="flex items-center gap-1 text-teal">
                <ShieldCheck size={14} /> Verified
              </span>
            )}
            {provider.homeCollection && (
              <span className="flex items-center gap-1">
                <Home size={14} /> Home collection available
              </span>
            )}
          </div>
        </div>
      </div>

      <iframe
        title="Provider location"
        src={mapSrc}
        className="mt-6 h-64 w-full rounded-xl2 border border-mist"
        loading="lazy"
      />

      {reviewableBookings.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-mist bg-surface p-5">
          <h2 className="font-display text-lg font-medium text-ink">Leave a review</h2>
          <p className="mt-1 text-xs text-ink/50">Based on your completed visit</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitReview.mutate();
            }}
            className="mt-4 space-y-3"
          >
            <select
              required
              value={reviewForm.bookingId}
              onChange={(e) => setReviewForm({ ...reviewForm, bookingId: e.target.value })}
              className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
            >
              <option value="">Which appointment?</option>
              {reviewableBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.testName} — {b.slot.date}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                  className="p-0.5"
                >
                  <Star size={22} className={n <= reviewForm.rating ? "fill-gold text-gold" : "text-mist"} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="How was your experience? (optional)"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitReview.isPending}
              className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep disabled:opacity-60"
            >
              Submit review
            </button>
          </form>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg font-medium text-ink">Reviews</h2>
        <div className="mt-4 space-y-4">
          {(reviewData?.reviews || []).map((r) => (
            <div key={r.id} className="rounded-xl2 border border-mist bg-surface p-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= r.rating ? "fill-gold text-gold" : "text-mist"} />
                ))}
                {r.verified && <span className="ml-2 text-xs font-medium text-teal">Verified visit</span>}
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
            </div>
          ))}
          {reviewData?.reviews.length === 0 && <p className="text-sm text-ink/50">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
