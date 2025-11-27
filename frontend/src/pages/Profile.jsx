import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2 } from "lucide-react";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const RELATIONS = ["self", "spouse", "child", "parent", "other"];

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", relation: "spouse", age: "", gender: "" });

  const { data } = useQuery({
    queryKey: ["family"],
    queryFn: async () => (await client.get("/family")).data.members,
  });

  const addMember = useMutation({
    mutationFn: async () =>
      (await client.post("/family", { ...form, age: form.age ? Number(form.age) : undefined })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      setForm({ name: "", relation: "spouse", age: "", gender: "" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id) => client.delete(`/family/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family"] }),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-medium text-ink">Your profile</h1>
      <div className="mt-4 rounded-xl2 border border-mist bg-surface p-5 text-sm text-ink/70">
        <p><span className="text-ink/40">Name:</span> {user.name}</p>
        <p className="mt-1"><span className="text-ink/40">Email:</span> {user.email}</p>
      </div>

      <h2 className="mt-10 font-display text-xl font-medium text-ink">Family members</h2>
      <p className="mt-1 text-sm text-ink/60">Book tests for your family and switch between profiles at checkout.</p>

      <div className="mt-4 space-y-3">
        {(data || []).map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl2 border border-mist bg-surface p-4">
            <div>
              <p className="font-medium text-ink">{m.name}</p>
              <p className="text-xs capitalize text-ink/50">{m.relation}{m.age ? ` · ${m.age} yrs` : ""}</p>
            </div>
            <button
              onClick={() => removeMember.mutate(m.id)}
              className="rounded-full p-2 text-ink/40 transition hover:bg-coral/10 hover:text-coral"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {data?.length === 0 && <p className="text-sm text-ink/50">No family members added yet.</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMember.mutate();
        }}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl2 border border-dashed border-mist p-5"
      >
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="col-span-2 rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
        />
        <select
          value={form.relation}
          onChange={(e) => setForm({ ...form, relation: e.target.value })}
          className="rounded-lg border border-mist px-4 py-2.5 capitalize focus:border-teal focus:outline-none"
        >
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          className="rounded-lg border border-mist px-4 py-2.5 focus:border-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={addMember.isPending}
          className="col-span-2 mt-1 flex items-center justify-center gap-2 rounded-full bg-teal py-2.5 text-sm font-medium text-paper transition hover:bg-teal-deep disabled:opacity-60"
        >
          <UserPlus size={15} /> Add family member
        </button>
      </form>
    </div>
  );
}
