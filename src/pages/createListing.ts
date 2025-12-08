import { createListing } from '../services/listingsAPI';
import type { CreateListingPayload } from '../services/listingsAPI';
import { createHTML } from '../services/utils';
import { isAuthenticated } from '../storage/authentication';


const outletId = "app-content";

export function renderCreateListing() {
    const root = document.getElementById(outletId);
    if (!root) return;
    if (!isAuthenticated()) {
        const el = createHTML(`
      <section class="mx-auto max-w-7xl px-6 py-12">
        <h1 class="text-2xl font-bold text-black mb-4">Create Listing</h1>
        <p class="text-gray-700">You need to <a href="/login" data-link class="text-blue-600 underline">log in</a> to create a listing.</p>
      </section>
    `);
        if (el) root.replaceChildren(el);
        return;
    }
    const el = createHTML(`
      <section class="mx-auto max-w-4xl px-6 py-12">
        <h1 class="text-3xl font-bold text-black mb-6">Create Listing</h1>
        <form id="create-listing-form" class="space-y-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input id="title" name="title" type="text" required
                   class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" name="description" rows="5"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"></textarea>
          </div>

          <div>
            <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input id="tags" name="tags" type="text" placeholder="art, vintage, electronics"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div class="space-y-3">
            <span class="block text-sm font-medium text-gray-700">Media URLs</span>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="mediaUrl1" class="block text-xs text-gray-600 mb-1">Image URL 1</label>
                <input id="mediaUrl1" type="url" placeholder="https://..."
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaAlt1" class="block text-xs text-gray-600 mb-1">Alt 1</label>
                <input id="mediaAlt1" type="text" placeholder="Main image description"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaUrl2" class="block text-xs text-gray-600 mb-1">Image URL 2</label>
                <input id="mediaUrl2" type="url" placeholder="https://..."
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label for="mediaAlt2" class="block text-xs text-gray-600 mb-1">Alt 2</label>
                <input id="mediaAlt2" type="text" placeholder="Second image description"
                       class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </div>
            <p class="text-xs text-gray-500">You can leave media fields empty if you don’t have images yet.</p>
          </div>

          <div>
            <label for="endsAt" class="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
                 <input id="endsAt" name="endsAt" type="datetime-local" required
                   class="dt-input hover:cursor-pointer w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <p class="text-xs text-gray-500 mt-1">Choose a future date and time.</p>
          </div>

          <div id="create-msg" class="text-sm"></div>

          <div class="flex gap-3">
            <button type="submit" class="rounded-md bg-blue-600 text-white px-5 py-2 font-semibold hover:bg-blue-700">Create Listing</button>
            <a href="/listings" data-link class="rounded-md border border-gray-300 text-gray-700 px-5 py-2 font-semibold hover:bg-gray-100">Cancel</a>
          </div>
        </form>
      </section>
    `);
    if (!el) return;
    root.replaceChildren(el);

    // refs
    const form = el.querySelector("#create-listing-form") as HTMLFormElement;
    const msg = el.querySelector("#create-msg") as HTMLElement;
    const titleEl = el.querySelector("#title") as HTMLInputElement;
    const descEl = el.querySelector("#description") as HTMLTextAreaElement;
    const tagsEl = el.querySelector("#tags") as HTMLInputElement;
    const endsAtEl = el.querySelector("#endsAt") as HTMLInputElement;
    const mediaUrl1 = el.querySelector("#mediaUrl1") as HTMLInputElement;
    const mediaAlt1 = el.querySelector("#mediaAlt1") as HTMLInputElement;
    const mediaUrl2 = el.querySelector("#mediaUrl2") as HTMLInputElement;
    const mediaAlt2 = el.querySelector("#mediaAlt2") as HTMLInputElement;

    // Submit handler: validate, build payload, create, then navigate
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";
      const title = titleEl.value.trim();
      if (!title) {
        msg.textContent = "Title is required.";
        msg.className = "text-sm text-red-600";
        return;
      }
      if (!endsAtEl.value) {
        msg.textContent = "Please select an end date/time.";
        msg.className = "text-sm text-red-600";
        return;
      }
      const endsAtDate = new Date(endsAtEl.value);
      if (isNaN(endsAtDate.getTime())) {
        msg.textContent = "Ends At must be a valid date/time.";
        msg.className = "text-sm text-red-600";
        return;
      }
      const now = Date.now();
      if (endsAtDate.getTime() <= now) {
        msg.textContent = "Ends At must be in the future.";
        msg.className = "text-sm text-red-600";
        return;
      }

      const tags = tagsEl.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const media = [
        mediaUrl1.value.trim()
          ? { url: mediaUrl1.value.trim(), alt: mediaAlt1.value.trim() }
          : null,
        mediaUrl2.value.trim()
          ? { url: mediaUrl2.value.trim(), alt: mediaAlt2.value.trim() }
          : null,
      ].filter(Boolean) as { url: string; alt: string }[];

      const payload: CreateListingPayload = {
        title,
        description: descEl.value.trim() || undefined,
        tags: tags.length ? tags : undefined,
        media: media.length ? media : undefined,
        endsAt: endsAtDate.toISOString(),
      };

      try {
        msg.textContent = "Creating listing…";
        msg.className = "text-sm text-gray-600";
        const envelope = await createListing(payload);
        const created = envelope?.data;
        if (!created?.id) {
          throw new Error("Failed to create listing.");
        }
        // Navigate to the new listing page
        history.pushState({ path: `/listings/${created.id}` }, "", `/listings/${created.id}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err: any) {
        msg.textContent = err?.message ?? "Failed to create listing.";
        msg.className = "text-sm text-red-600";
      }
    });
}


