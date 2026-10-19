"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Listing, Lead, Viewing, ViewingOutcome } from "../lib/types";

const outcomeLabels: Record<ViewingOutcome, string> = {
  pending: "Pending",
  interested: "Interested",
  not_interested: "Not interested",
  offer_made: "Offer made",
  no_show: "No-show",
};

export default function ViewingsPage() {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [listingId, setListingId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ViewingOutcome>("pending");
  const [feedback, setFeedback] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDue, setNextActionDue] = useState("");

  async function loadAll() {
    setLoading(true);
    const [viewingsRes, listingsRes, leadsRes] = await Promise.all([
      supabase
        .from("viewings")
        .select("*, listings(*), leads(*)")
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false }),
      supabase.from("listings").select("*").order("address"),
      supabase.from("leads").select("*").order("name"),
    ]);
    if (viewingsRes.error) setError(viewingsRes.error.message);
    else setViewings(viewingsRes.data ?? []);
    setListings(listingsRes.data ?? []);
    setLeads(leadsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("viewings").insert({
      listing_id: listingId,
      lead_id: leadId,
      scheduled_date: date,
      scheduled_time: time,
    });
    if (!error) {
      await supabase
        .from("listings")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", listingId);
    }
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setListingId("");
    setLeadId("");
    setDate("");
    setTime("");
    loadAll();
  }

  function openFeedbackForm(v: Viewing) {
    setEditingId(v.id);
    setOutcome(v.outcome);
    setFeedback(v.feedback ?? "");
    setNextAction(v.next_action ?? "");
    setNextActionDue(v.next_action_due ?? "");
  }

  async function saveFeedback(v: Viewing) {
    const { error } = await supabase
      .from("viewings")
      .update({
        outcome,
        feedback: feedback || null,
        next_action: nextAction || null,
        next_action_due: nextActionDue || null,
      })
      .eq("id", v.id);
    if (error) {
      setError(error.message);
      return;
    }
    await supabase
      .from("listings")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", v.listing_id);
    setEditingId(null);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this viewing?")) return;
    const { error } = await supabase.from("viewings").delete().eq("id", id);
    if (error) setError(error.message);
    else loadAll();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Viewings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
      >
        <select
          required
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Select listing</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.address}
            </option>
          ))}
        </select>
        <select
          required
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Select lead</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-4 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Scheduling..." : "Schedule viewing"}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : viewings.length === 0 ? (
          <p className="text-gray-400 text-sm">No viewings scheduled yet.</p>
        ) : (
          viewings.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {v.listings?.address ?? "Unknown listing"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {v.leads?.name ?? "Unknown lead"} &middot;{" "}
                    {v.scheduled_date} at {v.scheduled_time}
                  </p>
                  <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                    {outcomeLabels[v.outcome]}
                  </span>
                  {v.feedback && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Feedback:</span>{" "}
                      {v.feedback}
                    </p>
                  )}
                  {v.next_action && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Next action:</span>{" "}
                      {v.next_action}
                      {v.next_action_due && ` (due ${v.next_action_due})`}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 text-xs shrink-0">
                  <button
                    onClick={() => openFeedbackForm(v)}
                    className="text-blue-600 hover:underline"
                  >
                    Record feedback
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === v.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={outcome}
                    onChange={(e) =>
                      setOutcome(e.target.value as ViewingOutcome)
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {Object.entries(outcomeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    placeholder="Next action due"
                    value={nextActionDue}
                    onChange={(e) => setNextActionDue(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
                    rows={2}
                  />
                  <input
                    placeholder="Next action (e.g. call back, send contract)"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      onClick={() => saveFeedback(v)}
                      className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 text-sm px-3 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
