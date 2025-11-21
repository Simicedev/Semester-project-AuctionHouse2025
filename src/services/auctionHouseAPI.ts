import { get, put } from "../apiClient/apiClient";

// Shared media representation
export interface Media {
    url: string;
    alt: string;
}

// Listing summary used in profile-related endpoints
// Public profile subset (without credits and listing/win counts)
export interface ProfilePublic {
    name: string;
    email: string;
    bio: string;
    avatar: Media;
    banner: Media;
}

// Seller representation (adds wins array of listing ids)
export interface SellerProfile extends ProfilePublic {
    wins?: string[]; // array of won listing ids (present when _seller flag used on listing)
}

// Bid inside a listing context
export interface ListingBid {
    id: string;
    amount: number;
    bidder: ProfilePublic; // bidder public fields
    created: string; // ISO timestamp
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    tags: string[];
    media: Media[];
    created: string; // ISO string
    updated: string; // ISO string
    endsAt: string; // ISO string
    _count: { bids: number }; // always returned per docs
    seller?: SellerProfile; // included when _seller=true
    bids?: ListingBid[]; // included when _bids=true
}

// Base profile shape (without optional expanded arrays)
export interface ProfileBase {
    name: string;
    email: string;
    bio: string;
    avatar: Media;
    banner: Media;
    credits: number;
    _count: { listings: number; wins: number };
}

// Full profile with optional expansions
export interface Profile extends ProfileBase {
    listings?: Listing[]; // included when _listings=true
    wins?: Listing[]; // included when _wins=true
    meta?: any; // API returns meta object alongside data wrapper
}

// Bid representation for /bids endpoint
export interface Bid {
    id: string;
    amount: number;
    bidder: ProfileBase;
    created: string;
    listing?: Listing; // included when _listings flag used per docs
}

// Pagination / meta shape
export interface PaginationMeta {
    isFirstPage: boolean;
    isLastPage: boolean;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
    pageCount: number;
    totalCount: number;
}

// Generic envelope types
export interface DataEnvelope<T> { data: T; meta: any }
export interface PagedEnvelope<T> { data: T; meta: PaginationMeta }

// Query param builder (skips undefined / null)
function buildQuery(params: Record<string, any> = {}): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        // boolean flags should be 'true'/'false'
        search.append(key, String(value));
    });
    const queries = search.toString();
    return queries ? `?${queries}` : "";
}

// =============================
// Profiles API helpers
// =============================

export interface ProfilesQuery {
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: "asc" | "desc";
    _listings?: boolean; // include listings array in each profile
    _wins?: boolean; // include wins array in each profile
}

export function fetchProfiles(query: ProfilesQuery = {}): Promise<PagedEnvelope<ProfileBase[]>> {
    const qs = buildQuery(query);
    return get<PagedEnvelope<ProfileBase[]>>(`/auction/profiles${qs}`);
}

export interface SingleProfileQuery {
    _listings?: boolean;
    _wins?: boolean;
}

export function fetchProfile(name: string, query: SingleProfileQuery = {}): Promise<DataEnvelope<Profile>> {
    const qs = buildQuery(query);
    return get<DataEnvelope<Profile>>(`/auction/profiles/${encodeURIComponent(name)}${qs}`);
}

export interface UpdateProfilePayload {
    bio?: string;
    avatar?: Media; // must be publicly reachable
    banner?: Media; // must be publicly reachable
}

export function updateProfile(name: string, payload: UpdateProfilePayload): Promise<DataEnvelope<ProfileBase>> {
    return put<DataEnvelope<ProfileBase>>(`/auction/profiles/${encodeURIComponent(name)}`, payload);
}

// Listings created by profile
export interface ProfileListingsQuery {
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: "asc" | "desc";
    // additional flags matching listings endpoint could go here
}

export function fetchProfileListings(name: string, query: ProfileListingsQuery = {}): Promise<PagedEnvelope<Listing[]>> {
    const qs = buildQuery(query);
    return get<PagedEnvelope<Listing[]>>(`/auction/profiles/${encodeURIComponent(name)}/listings${qs}`);
}

// Wins (listings won by profile)
export interface ProfileWinsQuery {
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: "asc" | "desc";
}

export function fetchProfileWins(name: string, query: ProfileWinsQuery = {}): Promise<PagedEnvelope<Listing[]>> {
    const qs = buildQuery(query);
    return get<PagedEnvelope<Listing[]>>(`/auction/profiles/${encodeURIComponent(name)}/wins${qs}`);
}

// Bids made by profile
export interface ProfileBidsQuery {
    page?: number;
    limit?: number;
    sort?: string;
    sortOrder?: "asc" | "desc";
    _listings?: boolean; // include associated listing
}

export function fetchProfileBids(name: string, query: ProfileBidsQuery = {}): Promise<PagedEnvelope<Bid[]>> {
    const qs = buildQuery(query);
    return get<PagedEnvelope<Bid[]>>(`/auction/profiles/${encodeURIComponent(name)}/bids${qs}`);
}

// Wins already covered; provide search
export type SearchProfilesQuery = Omit<ProfilesQuery, "_wins" | "_listings">;

export function searchProfiles(q: string, query: SearchProfilesQuery = {}): Promise<PagedEnvelope<ProfileBase[]>> {
    const qs = buildQuery({ q, ...query });
    return get<PagedEnvelope<ProfileBase[]>>(`/auction/profiles/search${qs}`);
}


