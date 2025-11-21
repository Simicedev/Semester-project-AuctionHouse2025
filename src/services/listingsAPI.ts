import { get, post, put, del } from "../apiClient/apiClient";
import type { DataEnvelope, PagedEnvelope, Media, Listing } from "./auctionHouseAPI";

// Query flags & filters for listings collection
export interface ListingsQuery {
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: "asc" | "desc";
  _tag?: string; // filter by single tag
  _active?: boolean; // only active (endsAt in future)
  _seller?: boolean; // include seller object
  _bids?: boolean; // include bids array
}

export function fetchListings(query: ListingsQuery = {}): Promise<PagedEnvelope<Listing[]>> {
  const qs = buildQuery(query);
  return get<PagedEnvelope<Listing[]>>(`/auction/listings${qs}`);
}

export interface SingleListingQuery {
  _seller?: boolean;
  _bids?: boolean;
}

export function fetchListing(id: string, query: SingleListingQuery = {}): Promise<DataEnvelope<Listing>> {
  const qs = buildQuery(query);
  return get<DataEnvelope<Listing>>(`/auction/listings/${encodeURIComponent(id)}${qs}`);
}

export interface CreateListingPayload {
  title: string; // required
  description?: string;
  tags?: string[];
  media?: Media[]; // each url must be public
  endsAt: string; // ISO future date
}

export function createListing(payload: CreateListingPayload): Promise<DataEnvelope<Listing>> {
  return post<DataEnvelope<Listing>>(`/auction/listings`, payload);
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  tags?: string[];
  media?: Media[];
}

export function updateListing(id: string, payload: UpdateListingPayload): Promise<DataEnvelope<Listing>> {
  return put<DataEnvelope<Listing>>(`/auction/listings/${encodeURIComponent(id)}`, payload);
}

export function deleteListing(id: string): Promise<null> {
  return del<null>(`/auction/listings/${encodeURIComponent(id)}`);
}

export interface BidOnListingPayload { amount: number }

export function bidOnListing(id: string, amount: number): Promise<DataEnvelope<Listing>> {
  return post<DataEnvelope<Listing>>(`/auction/listings/${encodeURIComponent(id)}/bids`, { amount });
}

export type SearchListingsQuery = Omit<ListingsQuery, "_tag" | "_active">;

export function searchListings(q: string, query: SearchListingsQuery = {}): Promise<PagedEnvelope<Listing[]>> {
  const qs = buildQuery({ q, ...query });
  return get<PagedEnvelope<Listing[]>>(`/auction/listings/search${qs}`);
}

// Local query builder (duplicated lightly; could be extracted)
function buildQuery(params: Record<string, any>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const queries = search.toString();
  return queries ? `?${queries}` : "";
}
