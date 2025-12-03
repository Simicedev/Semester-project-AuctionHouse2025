import { createHTML } from "../services/utils";
import { fetchListing, bidOnListing } from "../services/listingsAPI";
import { isAuthenticated } from "../storage/authentication";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimeLeft(endsAtIso: string): string {
  const now = Date.now();
  const end = new Date(endsAtIso).getTime();
  const ms = Math.max(0, end - now);
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export async function renderSpecificListing(params?: { id?: string }) {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;
  const id = params?.id;
  if (!id) {
    const el = createHTML(`<section class="p-6"><h1 class="text-xl font-bold">Listing not found</h1></section>`);
    if (el) outlet.replaceChildren(el);
    return;
  }

  // Loading state
  outlet.replaceChildren(createHTML(`<section class="p-6"><div class="text-gray-600">Loading listing…</div></section>`)!);

  try {
    const envelope = await fetchListing(id, { _seller: true, _bids: true });
    const listing = envelope.data;
    const cover = listing.media?.[0]?.url ?? "";
    const title = listing.title ?? "Untitled";
    const description = escapeHtml((listing.description ?? "").trim());
    const bids = Array.isArray(listing.bids) ? listing.bids : [];
    const bidsSorted = [...bids].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    const highest = bids.reduce((max, b) => Math.max(max, b.amount), 0);
    const endsText = formatTimeLeft(listing.endsAt);

    const el = createHTML(`
      <section class="mx-auto max-w-7xl px-6 py-8">
        <div class="grid gap-8 md:grid-cols-2">
          <div class="rounded-lg overflow-hidden border border-gray-200 bg-white">
            <div class="relative w-full aspect-4/3  bg-gray-100 overflow-hidden">
              ${cover 
                ? `<img src="${cover}" alt="${listing.media?.[0]?.alt ?? title}" class="absolute inset-0 w-full h-full object-cover" width="1200" height="675" fetchpriority="high" />`
                : `<div class="absolute inset-0 flex items-center justify-center text-gray-500">No Image</div>`}
            </div>
          </div>
          ${listing.media && listing.media.length > 1 ? `
            <div class="grid grid-cols-4 gap-2 mt-2">
              ${listing.media.slice(1, 5).map(m => `<div class="relative w-full aspect-square overflow-hidden rounded border border-gray-200 bg-white"><img src="${m.url}" alt="${m.alt ?? title}" class="absolute inset-0 w-full h-full object-cover" width="300" height="300" loading="lazy"></div>`).join("")}
            </div>
          ` : ``}
          <div class="flex flex-col gap-4">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-black">${title}</h1>
              <div class="mt-2 flex items-center gap-3">
                <span class="rounded-md bg-green-600 px-3 py-1 text-white time-left" data-ends-at="${listing.endsAt}">Ends in ${endsText}</span>
                <span class="rounded-md bg-gray-100 px-3 py-1 text-gray-800">Bids: ${listing._count?.bids ?? 0}</span>
              </div>
            </div>
            ${description ? `<p class="text-gray-700 leading-relaxed">${description}</p>` : ``}
            <div class="p-4 rounded-lg bg-gray-50 border">
              <div class="text-gray-600">Current Price</div>
              <div class="text-2xl font-semibold text-black">${highest}</div>
            </div>

            <div class="p-4 rounded-lg border">
              <h2 class="text-lg font-semibold mb-3 text-black">Place a bid</h2>
              ${isAuthenticated() ? `
                <form id="bid-form" class="flex flex-col sm:flex-row gap-3">
                  <input id="bid-amount" type="number" min="${highest + 1}" step="1" class="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Enter your bid" required />
                  <button type="submit" class="rounded-md bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700">Bid</button>
                </form>
                <div id="bid-message" class="text-sm mt-2 text-gray-600"></div>
              ` : `
                <div class="text-gray-700">You must <a href="/login" data-link class="text-blue-600 underline">log in</a> to place a bid.</div>
              `}
            </div>
          </div>
        </div>

        <div class="mt-10">
          <h2 class="text-xl font-semibold text-black mb-4">Bid History</h2>
          ${bidsSorted.length === 0 ? `<div class="text-gray-600">No bids yet. Be the first!</div>` : `
            <ul class="divide-y rounded-lg border bg-white">
              ${bidsSorted.map(b => `
                <li class="p-4 flex items-center justify-between main-color border-b border-gray-200">
                  <div>
                    <div class="font-medium text-white">${b.bidder?.name ?? "Anonymous"}</div>
                    <div class="text-sm text-gray-400">${new Date(b.created).toLocaleString()}</div>
                  </div>
                  <div class="text-lg font-semibold text-white">${b.amount}</div>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      </section>
    `);
    if (!el) return;
    outlet.replaceChildren(el);

    // Countdown updater for this page
    const timer = window.setInterval(() => {
      const badge = document.querySelector<HTMLElement>(`.time-left[data-ends-at]`);
      if (!badge) return;
      const endsAt = badge.dataset.endsAt;
      if (!endsAt) return;
      badge.textContent = `Ends in ${formatTimeLeft(endsAt)}`;
    }, 1000);

    // Bid form handling (if present)
    const bidForm = document.getElementById("bid-form") as HTMLFormElement | null;
    const bidAmountInput = document.getElementById("bid-amount") as HTMLInputElement | null;
    const bidMessage = document.getElementById("bid-message") as HTMLElement | null;
    bidForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!bidAmountInput) return;
      const amount = parseInt(bidAmountInput.value, 10);
      if (isNaN(amount) || amount <= highest) {
        if (bidMessage) bidMessage.textContent = `Enter an amount greater than ${highest}.`;
        return;
      }
      try {
        if (bidMessage) bidMessage.textContent = "Placing bid…";
        await bidOnListing(id, amount);
        // Refresh listing after successful bid
        await renderSpecificListing({ id });
        // Ask nav to refresh credits (if applicable)
        window.dispatchEvent(new Event("credits:refresh"));
      } catch (err: any) {
        if (bidMessage) bidMessage.textContent = err?.message ?? "Failed to place bid";
      }
    });

    // Attempt cleanup on navigation by listening once for popstate
    const cleanup = () => window.clearInterval(timer);
    window.addEventListener("popstate", cleanup, { once: true });
  } catch (err: any) {
    const el = createHTML(`<section class="p-6"><div class="text-red-600">Failed to load listing: ${err?.message ?? "Unknown error"}</div></section>`);
    if (el) outlet.replaceChildren(el);
  }
}
