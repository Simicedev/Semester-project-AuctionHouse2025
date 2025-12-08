import { createHTML } from "../services/utils";
import { isAuthenticated, getUserName } from "../storage/authentication";
import { fetchProfile, updateProfile } from "../services/auctionHouseAPI";

export async function renderEditProfile() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;

  if (!isAuthenticated()) {
    const el = createHTML(`
      <section class="mx-auto max-w-7xl px-6 py-12">
        <h1 class="text-2xl font-bold text-black mb-4">Edit Profile</h1>
        <p class="text-gray-700">You need to <a href="/login" data-link class="text-blue-600 underline">log in</a> to edit your profile.</p>
      </section>
    `);
    if (el) outlet.replaceChildren(el);
    return;
  }

  const name = getUserName();
  if (!name) {
    const el = createHTML(`<section class="p-6"><h1 class="text-xl font-bold">Profile not found</h1></section>`);
    if (el) outlet.replaceChildren(el);
    return;
  }

  outlet.replaceChildren(createHTML(`<section class="p-6"><div class="text-gray-600">Loading profile…</div></section>`)!);

  try {
    const env = await fetchProfile(name);
    const profile = env.data;
    const bio = profile?.bio ?? "";
    const avatarUrl = profile?.avatar?.url ?? "";
    const avatarAlt = profile?.avatar?.alt ?? "";
    const bannerUrl = profile?.banner?.url ?? "";
    const bannerAlt = profile?.banner?.alt ?? "";

    const el = createHTML(`
      <section class="mx-auto max-w-4xl px-6 py-12">
        <h1 class="text-3xl font-bold text-black mb-6">Edit Profile</h1>
        <form id="edit-profile-form" class="space-y-6">
          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea id="bio" name="bio" rows="5" class="w-full rounded-md border border-gray-300 px-3 py-2">${bio.replace(/</g, "&lt;")}</textarea>
          </div>
          <div class="space-y-3">
            <span class="block text-sm font-medium text-gray-700">Avatar</span>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="avatarUrl" class="block text-xs text-gray-600 mb-1">Image URL</label>
                <input id="avatarUrl" type="url" placeholder="https://..." value="${avatarUrl.replace(/"/g, '&quot;')}" class="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label for="avatarAlt" class="block text-xs text-gray-600 mb-1">Alt</label>
                <input id="avatarAlt" type="text" placeholder="Avatar description" value="${avatarAlt.replace(/"/g, '&quot;')}" class="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <p class="text-xs text-gray-500">Public HTTPS image. URL must be ≤ 300 characters.</p>
          </div>
          <div class="space-y-3">
            <span class="block text-sm font-medium text-gray-700">Banner</span>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="bannerUrl" class="block text-xs text-gray-600 mb-1">Image URL</label>
                <input id="bannerUrl" type="url" placeholder="https://..." value="${bannerUrl.replace(/"/g, '&quot;')}" class="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label for="bannerAlt" class="block text-xs text-gray-600 mb-1">Alt</label>
                <input id="bannerAlt" type="text" placeholder="Banner description" value="${bannerAlt.replace(/"/g, '&quot;')}" class="w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <p class="text-xs text-gray-500">Public HTTPS image. URL must be ≤ 300 characters.</p>
          </div>

          <div id="profile-msg" class="text-sm"></div>

          <div class="flex gap-3">
            <button type="submit" class="rounded-md bg-blue-600 text-white px-5 py-2 font-semibold hover:bg-blue-700">Save Changes</button>
            <a href="/my-profile" data-link class="rounded-md border border-gray-300 text-gray-700 px-5 py-2 font-semibold hover:bg-gray-100">Cancel</a>
          </div>
        </form>
      </section>
    `);

    if (!el) return;
    outlet.replaceChildren(el);

    const form = el.querySelector("#edit-profile-form") as HTMLFormElement;
    const msg = el.querySelector("#profile-msg") as HTMLElement;
    const bioEl = el.querySelector("#bio") as HTMLTextAreaElement;
    const avatarUrlEl = el.querySelector("#avatarUrl") as HTMLInputElement;
    const avatarAltEl = el.querySelector("#avatarAlt") as HTMLInputElement;
    const bannerUrlEl = el.querySelector("#bannerUrl") as HTMLInputElement;
    const bannerAltEl = el.querySelector("#bannerAlt") as HTMLInputElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";

      const urlLimit = 300;
      const aUrl = avatarUrlEl.value.trim();
      const bUrl = bannerUrlEl.value.trim();
      if (aUrl && aUrl.length > urlLimit) {
        msg.textContent = `Avatar URL is too long (> ${urlLimit} chars).`;
        msg.className = "text-sm text-red-600";
        return;
      }
      if (bUrl && bUrl.length > urlLimit) {
        msg.textContent = `Banner URL is too long (> ${urlLimit} chars).`;
        msg.className = "text-sm text-red-600";
        return;
      }

      try {
        msg.textContent = "Saving…";
        msg.className = "text-sm text-gray-600";
        await updateProfile(name, {
          bio: bioEl.value.trim() || undefined,
          avatar: aUrl ? { url: aUrl, alt: avatarAltEl.value.trim() } : undefined,
          banner: bUrl ? { url: bUrl, alt: bannerAltEl.value.trim() } : undefined,
        });
        history.pushState({ path: "/my-profile" }, "", "/my-profile");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err: any) {
        msg.textContent = err?.message ?? "Failed to update profile.";
        msg.className = "text-sm text-red-600";
      }
    });
  } catch (err: any) {
    const el = createHTML(`<section class="p-6"><div class="text-red-600">Failed to load profile: ${err?.message ?? "Unknown error"}</div></section>`);
    if (el) outlet.replaceChildren(el);
  }
}
