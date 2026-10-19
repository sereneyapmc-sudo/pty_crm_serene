"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Listing, ListingStatus } from "../lib/types";

const statusLabels: Record<ListingStatus, string> = {
  active: "Active",
  under_offer: "Under offer",
  sold: "Sold",
  withdrawn: "Withdrawn",
};

const statusColors: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-700",
  under_offer: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-100 text-gray-700",
  withdrawn: "bg-red-100 text-red-700",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">(
    "all"
  );

  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadListings() {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setListings(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("listings").insert({
      address,
      price: Number(price),
      bedrooms: Number(bedrooms),
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAddress("");
    setPrice("");
    setBedrooms("");
    loadListings();
  }

  async function handleStatusChange(id: string, status: ListingStatus) {
    const { error } = await supabase
      .from("listings")
      .update({ status, last_activity_at: new Date().toISOString() })
      .eq("id", id);
    if (error) setError(error.message);
    else loadListings();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) setError(error.message);
    else loadListings();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Listings</h1>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ListingStatus | "all")
          }
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <input
          required
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm sm:col-span-1"
        />
        <input
          required
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Bedrooms"
          type="number"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-3 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add listing"}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Address</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Beds</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Last activity</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-gray-400" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-400" colSpan={6}>
                  No listings yet.
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{listing.address}</td>
                  <td className="px-4 py-2">
                    ${listing.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{listing.bedrooms}</td>
                  <td className="px-4 py-2">
                    <select
                      value={listing.status}
                      onChange={(e) =>
                        handleStatusChange(
                          listing.id,
                          e.target.value as ListingStatus
                        )
                      }
                      className={`text-xs rounded-full px-2 py-1 border-0 ${
                        statusColors[listing.status]
                      }`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(listing.last_activity_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
