export type ListingStatus = "active" | "under_offer" | "sold" | "withdrawn";

export type Listing = {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  status: ListingStatus;
  last_activity_at: string;
  created_at: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  budget: number | null;
  preferred_area: string | null;
  created_at: string;
};

export type ViewingOutcome =
  | "pending"
  | "interested"
  | "not_interested"
  | "offer_made"
  | "no_show";

export type Viewing = {
  id: string;
  listing_id: string;
  lead_id: string;
  scheduled_date: string;
  scheduled_time: string;
  outcome: ViewingOutcome;
  feedback: string | null;
  next_action: string | null;
  next_action_due: string | null;
  created_at: string;
  listings?: Listing;
  leads?: Lead;
};
