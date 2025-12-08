import { createHTML } from "../services/utils";
import { isAuthenticated } from "../storage/authentication";
import { fetchSingleListing, updateListing } from "../services/listingsAPI";

export async function renderEditListing(params?: { id?: string }) {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;

  if (!isAuthenticated()) {
    const el = createHTML(`
      <section class="mx-auto max-w-7xl px-6 py-12">
        <h1 class="text-2xl font-bold text-black mb-4">Edit Listing</h1>
        <p class="text-gray-700">You need to <a href="/login" data-link class="text-blue-600 underline">log in</a> to edit a listing.</p>
      </section>
    `);
    if (el) outlet.replaceChildren(el);
    return;
  }

  const id = params?.id;
  if (!id) {
    const el = createHTML(`<section class="p-6"><h1 class="text-xl font-bold">Listing not found</h1></section>`);
    if (el) outlet.replaceChildren(el);
    return;
  }

  outlet.replaceChildren(createHTML(`<section class="p-6"><div class="text-gray-600">Loading listing…</div></section>`)!);

  try {
    const envelope = await fetchSingleListing(id, { _seller: true, _bids: true });
    const listing = envelope.data;

    const title = listing.title ?? "";
    const description = listing.description ?? "";
    const tags = Array.isArray(listing.tags) ? listing.tags.join(", ") : "";
    const media1 = listing.media?.[0];
    const media2 = listing.media?.[1];
    const endsAtIso = listing.endsAt;
    const endsAtLocal = new Date(endsAtIso).toISOString().slice(0, 16); // for datetime-local

    const el = createHTML(`
      <section class="mx-auto max-w-4xl px-6 py-12">
        <h1 class="text-3xl font-bold text-black mb-6">Edit Listing</h1>
        <form id="edit-listing-form" class="space-y-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input id="title" name="title" type="text" required value="${title.replace(/"/g, '&quot;')}"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows="5"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600">${(description ?? "").replace(/</g, "&lt;")}</textarea>
          </div>

          <div>
            <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input id="tags" name="tags" type="text" value="${tags.replace(/"/g, '&quot;')}"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div class="space-y-3">
            <span class="block text-sm font-medium text-gray-700">Media URLs</span>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="mediaUrl1" class="block text-xs text-gray-600 mb-1">Image URL 1</label>
                <input id="mediaUrl1" type="url" placeholder="https://..." value="${media1?.url ? media1.url.replace(/"/g, '&quot;') : ''}"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaAlt1" class="block text-xs text-gray-600 mb-1">Alt 1</label>
                <input id="mediaAlt1" type="text" placeholder="Main image description" value="${media1?.alt ? media1.alt.replace(/"/g, '&quot;') : ''}"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaUrl2" class="block text-xs text-gray-600 mb-1">Image URL 2</label>
                <input id="mediaUrl2" type="url" placeholder="https://..." value="${media2?.url ? media2.url.replace(/"/g, '&quot;') : ''}"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaAlt2" class="block text-xs text-gray-600 mb-1">Alt 2</label>
                <input id="mediaAlt2" type="text" placeholder="Second image description" value="${media2?.alt ? media2.alt.replace(/"/g, '&quot;') : ''}"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500">URL limit is 300 characters; longer URLs will be rejected by the API.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
            <input type="datetime-local" value="${endsAtLocal}" disabled
                   class="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-600" />
            <p class="text-xs text-gray-500 mt-1">Ends date cannot be changed after creation.</p>
          </div>

          <div id="edit-msg" class="text-sm"></div>

          <div class="flex gap-3">
            <button type="submit" class="rounded-md bg-blue-600 text-white px-5 py-2 font-semibold hover:bg-blue-700">Save Changes</button>
            <a href="/listings/${listing.id}" data-link class="rounded-md border border-gray-300 text-gray-700 px-5 py-2 font-semibold hover:bg-gray-100">Cancel</a>
          </div>
        </form>
      </section>
    `);

    if (!el) return;
    outlet.replaceChildren(el);

    const form = el.querySelector("#edit-listing-form") as HTMLFormElement;
    const msg = el.querySelector("#edit-msg") as HTMLElement;
    const titleEl = el.querySelector("#title") as HTMLInputElement;
    const descEl = el.querySelector("#description") as HTMLTextAreaElement;
    const tagsEl = el.querySelector("#tags") as HTMLInputElement;
    const mediaUrl1 = el.querySelector("#mediaUrl1") as HTMLInputElement;
    const mediaAlt1 = el.querySelector("#mediaAlt1") as HTMLInputElement;
    const mediaUrl2 = el.querySelector("#mediaUrl2") as HTMLInputElement;
    const mediaAlt2 = el.querySelector("#mediaAlt2") as HTMLInputElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";
      const title = titleEl.value.trim();
      if (!title) {
        msg.textContent = "Title is required.";
        msg.className = "text-sm text-red-600";
        return;
      }

      // Validate URL length
      const urlLimit = 300;
      const url1 = mediaUrl1.value.trim();
      const url2 = mediaUrl2.value.trim();
      if (url1 && url1.length > urlLimit) {
        msg.textContent = `Image URL 1 is too long (> ${urlLimit} chars).`;
        msg.className = "text-sm text-red-600";
        return;
      }
      if (url2 && url2.length > urlLimit) {
        msg.textContent = `Image URL 2 is too long (> ${urlLimit} chars).`;
        msg.className = "text-sm text-red-600";
        return;
      }

      const tags = tagsEl.value.split(",").map(t => t.trim()).filter(Boolean);
      const media = [
        url1 ? { url: url1, alt: mediaAlt1.value.trim() } : null,
        url2 ? { url: url2, alt: mediaAlt2.value.trim() } : null,
      ].filter(Boolean) as { url: string; alt: string }[];

      try {
        msg.textContent = "Saving…";
        msg.className = "text-sm text-gray-600";
        await updateListing(id, {
          title,
          description: descEl.value.trim() || undefined,
          tags: tags.length ? tags : undefined,
          media: media.length ? media : undefined,
        });
        history.pushState({ path: `/listings/${id}` }, "", `/listings/${id}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err: any) {
        msg.textContent = err?.message ?? "Failed to update listing.";
        msg.className = "text-sm text-red-600";
      }
    });
  } catch (err: any) {
    const el = createHTML(`<section class="p-6"><div class="text-red-600">Failed to load listing: ${err?.message ?? "Unknown error"}</div></section>`);
    if (el) outlet.replaceChildren(el);
  }
}
