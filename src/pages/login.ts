import { loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";
import { createHTML } from "../services/utils";


const outletId = "app-content";

export function renderLogin() {
  const root = document.getElementById(outletId);
  if (!root) return;
  const el = createHTML(`
    <section class="main-color min-h-screen">
      <div class="relative grid w-full min-h-screen md:grid-cols-2">
        <div class="hidden md:flex h-full flex-col justify-center p-8 text-white">
          <div class="max-w-[80%]">
            <h2 class="text-4xl font-extrabold mb-3">
              <span class="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-blue-600">HammerAuctions</span>
            </h2>
            <p class="text-white/80 mb-5 text-xl">Bid, win, and collect unique items with live auctions.</p>
            <ul class="space-y-2 text-white/80 text-lg">
              <li>• Real-time bidding and live countdowns</li>
              <li>• Trusted sellers and verified profiles</li>
              <li>• Track credits directly in the navbar</li>
            </ul>
          </div>
        </div>
        
        <div class="bg-white h-full p-8">
          <h1 class="text-2xl font-bold mb-1">Login</h1>
          <p class="text-gray-600 mb-4 text-lg">Welcome back — sign in to continue.</p>
          <form id="login-form" class="flex flex-col gap-3 text-black">
            <label class="flex flex-col text-sm font-medium text-gray-700">Email
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="email" type="email" required />
            </label>
            <label class="flex flex-col text-sm font-medium text-gray-700">Password
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="password" type="password" required />
            </label>
            <button class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition" type="submit">Login</button>
            <p id="login-msg" class="mt-2 text-sm text-gray-700"></p>
            <div class="mt-3 text-sm text-gray-600">New here? <a href="/register" data-link class="text-blue-700 hover:underline">Create an account</a></div>
          </form>
        </div>
      </div>
    </section>
  `);
  if (el) root.replaceChildren(el);

  const form = document.getElementById("login-form") as HTMLFormElement | null;
  const msg = document.getElementById("login-msg");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    if (msg) msg.textContent = "Logging in…";
    try {
      const response = await loginUser({ email, password });
      console.log("Login response:", response);
      setAuth({
        accessToken: response.data.accessToken,
        name: response.data.name,
        email: response.data.email,
      });
      console.log(
        "login.ts: accessToken now in LS?",
        localStorage.getItem("accessToken")
      );
      emitAuthChanged();
      if (msg) msg.textContent = `Logged in as ${response.data.name}`;
      history.pushState({ path: "/" }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err: any) {
      if (msg) msg.textContent = err?.message || "Login failed";
    }
  });
}
