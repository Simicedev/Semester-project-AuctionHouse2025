import { createHTML } from "../services/utils";
import { fetchListings, searchListings } from "../services/listingsAPI";
import type { PagedEnvelope } from "../services/auctionHouseAPI";

// Prevent broken HTML when user-provided text includes characters like < or &.
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
	const milliSeconds = Math.max(0, end - now);
	const totalMinutes = Math.floor(milliSeconds / 60000);
	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
	const minutes = totalMinutes % 60;
	const seconds = Math.floor((milliSeconds % 60000) / 1000);
	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
	return `${minutes}m ${seconds}s`;
}

export async function renderAllListings() {
	const outlet = document.getElementById("app-content");
	if (!outlet) return;

	const el = createHTML(`
		<section class="mx-auto max-w-7xl px-6 py-8">
			<header class="mb-6">
				<h1 class="text-2xl sm:text-3xl font-bold text-black">All Listings</h1>
				<p class="text-gray-600">Browse every ongoing auction.</p>
			</header>

			<!-- Filters/Search -->
			<form id="listings-filters" class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
				<div>
					<label for="search-q" class="block text-sm font-medium text-gray-700">Search</label>
					<input id="search-q" name="q" type="text" placeholder="Title or description" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
				</div>
				<div>
					<label for="filter-tag" class="block text-sm font-medium text-gray-700">Tag</label>
					<input id="filter-tag" name="_tag" type="text" placeholder="e.g. electronics" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
				</div>
				<div>
					<label for="sort" class="block text-sm font-medium text-gray-700">Sort</label>
					<select id="sort" name="sort" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
						<option value="endsAt">Ends At</option>
						<option value="created">Created</option>
						<option value="_count.bids">Most Bids</option>
					</select>
				</div>
				<div class="flex gap-2">
					<div class="flex-1">
						<label for="sortOrder" class="block text-sm font-medium text-gray-700">Order</label>
						<select id="sortOrder" name="sortOrder" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
							<option value="asc">Asc</option>
							<option value="desc">Desc</option>
						</select>
					</div>
					<div class="flex items-center gap-2 mt-6">
						<input id="active-only" name="_active" type="checkbox" class="rounded border-gray-300" checked />
						<label for="active-only" class="text-sm text-gray-700">Active only</label>
					</div>
					<button id="apply-filters" type="submit" class="mt-6 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700">Apply</button>
				</div>
			</form>

			<div id="listings-grid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>

			<div class="mt-6 flex justify-center">
				<button id="load-more" class="rounded-md border border-gray-300 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-100">Load More</button>
			</div>
		</section>
	`);

	if (el) outlet.replaceChildren(el);

	const grid = document.getElementById("listings-grid") as HTMLElement | null;
	const filtersForm = document.getElementById("listings-filters") as HTMLFormElement | null;
	const qInput = document.getElementById("search-q") as HTMLInputElement | null;
	const tagInput = document.getElementById("filter-tag") as HTMLInputElement | null;
	const sortSelect = document.getElementById("sort") as HTMLSelectElement | null;
	const orderSelect = document.getElementById("sortOrder") as HTMLSelectElement | null;
	const activeOnly = document.getElementById("active-only") as HTMLInputElement | null;
	const loadMoreBtn = document.getElementById("load-more") as HTMLButtonElement | null;
	// New pagination controls (Prev/Next + info)
	const pager = createHTML(`
		<div class="mt-4 flex items-center justify-center gap-3">
			<button id="prev-page" class="rounded-md border border-gray-300 text-gray-700 px-3 py-1 text-sm hover:bg-gray-100">Prev</button>
			<span id="page-info" class="text-sm text-gray-600">Page 1 of …</span>
			<button id="next-page" class="rounded-md border border-gray-300 text-gray-700 px-3 py-1 text-sm hover:bg-gray-100">Next</button>
		</div>
	`);
	if (pager && grid?.parentElement) grid.parentElement.appendChild(pager);
	const prevBtn = document.getElementById("prev-page") as HTMLButtonElement | null;
	const nextBtn = document.getElementById("next-page") as HTMLButtonElement | null;
	const pageInfo = document.getElementById("page-info") as HTMLSpanElement | null;

	let page = 1;
	const limit = 12;
	let loading = false;
	let countdownTimer: number | null = null;
	let lastQueryMode: "search" | "list" = "list";
	let lastSearchQ: string = "";

	function startCountdownUpdater() {
		if (countdownTimer) return;
		countdownTimer = window.setInterval(() => {
			const badges = document.querySelectorAll<HTMLElement>('.time-left[data-ends-at]');
			const now = Date.now();
			badges.forEach((el) => {
				const endsAtIso = el.dataset.endsAt;
				if (!endsAtIso) return;
				const end = new Date(endsAtIso).getTime();
				const ms = Math.max(0, end - now);
				const totalMinutes = Math.floor(ms / 60000);
				const days = Math.floor(totalMinutes / (60 * 24));
				const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
				const minutes = totalMinutes % 60;
				const seconds = Math.floor((ms % 60000) / 1000);
				let txt = '';
				if (days > 0) txt = `${days}d ${hours}h ${minutes}m`;
				else if (hours > 0) txt = `${hours}h ${minutes}m ${seconds}s`;
				else txt = `${minutes}m ${seconds}s`;
				el.textContent = `Ends in ${txt}`;
			});
		}, 1000);
	}

	async function loadPage(append = false) {
		if (loading) return;
		loading = true;
		if (!grid) return;
		if (!append) grid.innerHTML = `<div class="text-gray-600">Loading…</div>`;
		try {
			const base = {
				sort: sortSelect?.value || "endsAt",
				sortOrder: (orderSelect?.value as "asc" | "desc") || "asc",
				_active: activeOnly?.checked ?? true,
				page,
				limit,
			};
			let envelope: PagedEnvelope<any>;
			if (lastQueryMode === "search" && lastSearchQ.trim()) {
				envelope = await searchListings(lastSearchQ.trim(), base as any) as PagedEnvelope<any>;
			} else {
				const listQuery = { ...base, _tag: tagInput?.value?.trim() || undefined } as any;
				envelope = await fetchListings(listQuery) as PagedEnvelope<any>;
			}
			const { data, meta } = envelope;
			const frag = document.createDocumentFragment();

			data.forEach((item: any) => {
				const cover = item.media?.[0]?.url ?? "";
				const title = item.title ?? "Untitled";
				const descRaw = (item.description ?? "").trim();
				const short = descRaw.length > 100 ? `${descRaw.slice(0, 97)}…` : descRaw;
				const description = escapeHtml(short);
				const timeLeft = formatTimeLeft(item.endsAt);
				const bidsCount = item._count?.bids ?? 0;

				const card = createHTML(`
					<article class="flex flex-col text-center rounded-lg overflow-hidden border border-white/10 bg-white backdrop-blur shadow-md">
						${cover
							? `<img src="${cover}" alt="${item.media?.[0]?.alt ?? title}" class="w-full h-40 object-cover">`
							: `<div class="w-full h-40 flex items-center justify-center bg-gray-200 text-gray-600" aria-label="No image">No Image</div>`}
						<div class="p-4 relative h-64 flex flex-col overflow-hidden">
							<h3 class="text-xl font-semibold mb-2 text-black line-clamp-2">${title}</h3>
							${description ? `<p class="text-base text-gray-600 mb-2 leading-snug line-clamp-3">${description}</p>` : ""}
							<div class="flex items-center justify-center gap-2 text-base w-full">
								<span class="rounded-md bg-green-600 px-3 py-1 text-white time-left" data-ends-at="${item.endsAt}">Ends in ${timeLeft}</span>
							</div>
							<p class="mt-2 text-base text-gray-700">Bids: ${bidsCount}</p>
							<a href="/listings/${item.id}" data-link class="mt-auto inline-block w-fit self-center rounded-md bg-blue-600 text-white px-5 py-3 text-lg font-semibold shadow-sm hover:bg-blue-700 transition">View and Bid</a>
						</div>
					</article>
				`);
				if (card) frag.appendChild(card);
			});

			if (append) grid.appendChild(frag);
			else grid.replaceChildren(frag);

			// Update pagination controls
			if (pageInfo && meta) pageInfo.textContent = `Page ${meta.currentPage} of ${meta.pageCount}`;
			if (prevBtn && meta) {
				prevBtn.disabled = meta.isFirstPage;
				prevBtn.classList.toggle("opacity-50", meta.isFirstPage);
			}
			if (nextBtn && meta) {
				nextBtn.disabled = meta.isLastPage;
				nextBtn.classList.toggle("opacity-50", meta.isLastPage);
			}
			if (loadMoreBtn) {
				// Hide the old Load More when using explicit pagination
				loadMoreBtn.style.display = "none";
			}
		} finally {
			loading = false;
			// Ensure countdown updater is running after render
			startCountdownUpdater();
		}
	}

	// initial load
	loadPage(false);
	// Start countdown right away too
	startCountdownUpdater();

	// Explicit pagination handlers
	prevBtn?.addEventListener("click", () => {
		if (page > 1) {
			page -= 1;
			loadPage(false);
		}
	});
	nextBtn?.addEventListener("click", () => {
		page += 1;
		loadPage(false);
	});

	// Apply filters/search
	filtersForm?.addEventListener("submit", (e) => {
		e.preventDefault();
		page = 1;
		const q = qInput?.value ?? "";
		lastSearchQ = q;
		lastQueryMode = q.trim() ? "search" : "list";
		loadPage(false);
	});
}
