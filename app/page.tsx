"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Listing, Viewing } from "./lib/types";

function daysAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const [todaysViewings, setTodaysViewings] = useState<Viewing[]>([]);
  const [followUps, setFollowUps] = useState<Viewing[]>([]);
  const [staleListings, setStaleListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const fourteenDaysAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [todayRes, followUpRes, listingsRes] = await Promise.all([
        supabase
          .from("viewings")
          .select("*, listings(*), leads(*)")
          .eq("scheduled_date", today)
          .order("scheduled_time"),
        supabase
          .from("viewings")
          .select("*, listings(*), leads(*)")
          .not("next_action", "is", null)
          .lte("next_action_due", today)
          .order("next_action_due"),
        supabase
          .from("listings")
          .select("*")
          .lt("last_activity_at", fourteenDaysAgo)
          .in("status", ["active", "under_offer"])
          .order("last_activity_at"),
      ]);

      if (todayRes.error) setError(todayRes.error.message);
      else setTodaysViewings(todayRes.data ?? []);

      if (followUpRes.error) setError(followUpRes.error.message);
      else setFollowUps(followUpRes.data ?? []);

      if (listingsRes.error) setError(listingsRes.error.message);
      else setStaleListings(listingsRes.data ?? []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Today&apos;s viewings ({todaysViewings.length})
        </h2>
        {todaysViewings.length === 0 ? (
          <p className="text-sm text-gray-400">No viewings scheduled today.</p>
        ) : (
          <div className="space-y-2">
            {todaysViewings.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-lg p-3 text-sm flex justify-between"
              >
                <span>
                  <span className="font-medium">{v.scheduled_time}</span> —{" "}
                  {v.listings?.address} with {v.leads?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Follow-ups due ({followUps.length})
        </h2>
        {followUps.length === 0 ? (
          <p className="text-sm text-gray-400">No follow-ups due.</p>
        ) : (
          <div className="space-y-2">
            {followUps.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-lg p-3 text-sm"
              >
                <p>
                  <span className="font-medium">{v.leads?.name}</span> —{" "}
                  {v.next_action}
                  {v.next_action_due && (
                    <span className="text-red-600">
                      {" "}
                      (due {v.next_action_due})
                    </span>
                  )}
                </p>
                <p className="text-gray-500">{v.listings?.address}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Listings with no activity in 14+ days ({staleListings.length})
        </h2>
        {staleListings.length === 0 ? (
          <p className="text-sm text-gray-400">All listings are active.</p>
        ) : (
          <div className="space-y-2">
            {staleListings.map((l) => (
              <div
                key={l.id}
                className="bg-white border border-gray-200 rounded-lg p-3 text-sm flex justify-between"
              >
                <span>{l.address}</span>
                <span className="text-gray-500">
                  {daysAgo(l.last_activity_at)} days since last activity
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
