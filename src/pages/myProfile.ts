import { createHTML } from "../services/utils";
import { isAuthenticated, getUserName } from "../storage/authentication";
import {
  fetchProfile,
  fetchProfileListings,
  fetchProfileWins,
  fetchProfileBids,
  fetchCredits,
  type Profile,
  type Listing,
  type Bid,
} from "../services/auctionHouseAPI";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function renderMyProfile() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;

  if (!isAuthenticated()) {
    const el = createHTML(`
      <section class="mx-auto max-w-7xl px-6 py-12">
        <h1 class="text-2xl font-bold text-black mb-4">My Profile</h1>
        <p class="text-gray-700">You need to <a href="/login" data-link class="text-blue-600 underline">log in</a> to view your profile.</p>
      </section>
    `);
    if (el) outlet.replaceChildren(el);
    return;
  }

  const name = getUserName();
  outlet.replaceChildren(createHTML(`<section class="p-6"><div class="text-gray-600">Loading profile…</div></section>`)!);

  try {
    const [{ data: profileEnv }, listingsEnv, winsEnv, bidsEnv, creditsEnv] = await Promise.all([
      fetchProfile(name as string),
      fetchProfileListings(name as string, { sort: "created", sortOrder: "desc", limit: 12 }),
      fetchProfileWins(name as string, { sort: "created", sortOrder: "desc", limit: 12 }),
      fetchProfileBids(name as string, { sort: "created", sortOrder: "desc", limit: 12, _listings: true }),
      fetchCredits(name as string),
    ]);

    const profile = profileEnv as Profile;
    const credits = creditsEnv?.data?.credits ?? 0;

    const bannerUrl = profile?.banner?.url || "";
    const avatarUrl = profile?.avatar?.url || "";
    const bio = escapeHtml(profile?.bio || "");

    const listings = (listingsEnv?.data ?? []) as Listing[];
    const wins = (winsEnv?.data ?? []) as Listing[];
    const bids = (bidsEnv?.data ?? []) as Bid[];

    const el = createHTML(`
      <section class="mx-auto max-w-full">
        <div class="overflow-hidden border bg-white">
          <div class="relative w-full max-w-full h-64 bg-gray-100">
            ${bannerUrl ? `<img src="${bannerUrl}" alt="Banner" class="absolute inset-0 w-full h-full object-cover">` : ``}
          </div>
          <div class="p-6 flex items-center gap-4">
            <div class="relative w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
              ${avatarUrl ? `<img src="${avatarUrl}" alt="Avatar" class="absolute inset-0 w-full h-full object-cover">` : ``}
            </div>
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-black">${profile?.name ?? "Unnamed"}</h1>
              ${bio ? `<p class="text-gray-700">${bio}</p>` : ``}
              <div class="mt-2 flex flex-wrap items-center gap-2 ">
                <span class="inline-flex items-center rounded-md bg-gray-100 text-gray-900 px-2 py-1">Credits: ${credits}</span>
                <span class="inline-flex items-center rounded-md bg-gray-100 text-gray-900 px-2 py-1">Listings: ${profile?._count?.listings ?? 0}</span>
                <span class="inline-flex items-center rounded-md bg-gray-100 text-gray-900 px-2 py-1">Wins: ${profile?._count?.wins ?? 0}</span>
                <a href="#" class="block rounded-md px-2 py-1 text-base font-medium text-white bg-blue-600 hover:bg-blue-700">Edit Profile</a>
                <a href="/create-listing" class="block rounded-md px-2 py-1 text-base font-medium text-white hover:bg-green-700 hover:text-white bg-green-600">+ Create Listing</a>
              </div>
             
            </div>
          </div>
        </div>

        <div class="mt-8 grid gap-8 md:grid-cols-3 p-6">
          <div class="md:col-span-2">
            <h2 class="text-xl font-semibold text-black mb-3">Your Listings</h2>
            ${listings.length === 0 ? `<div class="text-gray-600">No listings yet.</div>` : `
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${listings.map((l) => `
                  <article class="rounded-lg overflow-hidden border bg-white">
                    ${l.media?.[0]?.url ? `<img src="${l.media[0].url}" alt="${l.media[0].alt ?? l.title}" class="w-full h-50 object-cover">` : `<div class="w-full h-40 bg-gray-100"></div>`}
                    <div class="p-4">
                      <h3 class="font-semibold text-black line-clamp-2">${l.title}</h3>
                      <p class="text-gray-700 mt-2 line-clamp-3">${l.description ? l.description:"No description"}</p>
                      <a href="/listings/${l.id}" data-link class="mt-3 inline-block rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">View</a>
                      <a href="/listings/${l.id}" data-link class="mt-3 inline-block rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">Edit</a>
                      <div class="mt-3 inline-block rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 cursor-pointer">Delete</div>
                    </div>
                  </article>
                `).join("")}
              </div>
            `}
          </div>

          <div>
            <h2 class="text-xl font-semibold text-black mb-3">Recent Bids</h2>
            ${bids.length === 0 ? `<div class="text-gray-600">No bids yet.</div>` : `
              <ul class="divide-y rounded-lg border bg-white">
                ${bids.slice(0, 8).map((b) => {
                  const listingId = b.listing?.id;
                  const listingTitle = b.listing?.title || "Listing";
                  const when = new Date(b.created).toLocaleString();
                  return `
                    <li class="p-3 flex items-center justify-between gap-3">
                      <div class="flex flex-col">
                        <a href="${listingId ? `/listings/${listingId}` : '#'}" ${listingId ? 'data-link' : ''} class="text-sm font-medium text-blue-600 hover:underline line-clamp-1">${listingTitle}</a>
                        <div class="text-xs text-gray-600">${when}</div>
                      </div>
                      <div class="text-sm font-semibold text-black">${b.amount}</div>
                    </li>
                  `;
                }).join("")}
              </ul>
            `}
            <h2 class="text-xl font-semibold text-black mt-8 mb-3">Wins</h2>
            ${wins.length === 0 ? `<div class="text-gray-600">No wins yet.</div>` : `
              <ul class="divide-y rounded-lg border bg-white">
                ${wins.slice(0, 8).map((w) => `
                  <li class="p-3 flex items-center justify-between">
                    <div class="text-sm text-gray-700 line-clamp-1">${w.title}</div>
                    <a href="/listings/${w.id}" data-link class="text-blue-600 text-sm">View</a>
                  </li>
                `).join("")}
              </ul>
            `}
          </div>
        </div>
      </section>
    `);
    if (el) outlet.replaceChildren(el);
  } catch (err: any) {
    const el = createHTML(`<section class="p-6"><div class="text-red-600">Failed to load profile: ${err?.message ?? "Unknown error"}</div></section>`);
    if (el) outlet.replaceChildren(el);
  }
}

