import { registerUser, loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";
import { createHTML } from "../services/utils";

const outletId = "app-content";

export function renderRegister() {
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
            <p class="text-white/80 mb-5 text-xl">Create your account to start bidding and listing.</p>
            <ul class="space-y-2 text-white/80 text-lg">
              <li>• Build a profile with avatar and banner</li>
              <li>• Earn and track credits for bidding</li>
              <li>• Follow auctions with live countdowns</li>
              <li>• x@stud.noroff.no required</li>
            </ul>
          </div>
        </div>
        <div class="bg-white h-full md:flex p-0">     
          <div class="p-8 flex-1">
          <h1 class="text-2xl font-bold mb-1">Register</h1>
          <p class="text-gray-600 mb-4 text-lg">Join HammerAuctions — it’s quick and free.</p>
          <form id="register-form" class="flex flex-col gap-3">
            <label class="flex flex-col text-sm font-medium text-gray-700">Username
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="name" required pattern="[A-Za-z0-9_]+" title="Letters, numbers and underscore only" />
            </label>
            <label class="flex flex-col text-sm font-medium text-gray-700">Email
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="email" type="email" required />
            </label>
            <label class="flex flex-col text-sm font-medium text-gray-700">Password
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="password" type="password" minlength="8" required />
            </label>
            <label class="flex flex-col text-sm font-medium text-gray-700">Avatar URL
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="avatar" type="url" placeholder="https://..." />
            </label>
            <label class="flex flex-col text-sm font-medium text-gray-700">Banner URL
              <input class="mt-1 border rounded-xl p-2 text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" name="banner" type="url" placeholder="https://..." />
            </label>
            <div class="flex items-start gap-2 mb-1">
              <input id="checkbox-2" type="checkbox" required class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500" />
              <label for="checkbox-2" class="text-sm font-medium text-gray-700">I agree to the <a href="#" class="text-blue-700 hover:underline">terms and conditions</a>.</label>
            </div>
            <button class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition" type="submit">Create account</button>
            <p id="register-msg" class="mt-2 text-sm text-gray-700"></p>
            <div class="mt-3 text-sm text-gray-600">Already have an account? <a href="/login" data-link class="text-blue-700 hover:underline">Login</a></div>
          </form>
          </div>
        </div>
      </div>
    </section>
  `);
  if (el) root.replaceChildren(el);

  const form = document.getElementById(
    "register-form"
  ) as HTMLFormElement | null;
  const msg = document.getElementById("register-msg");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      avatar: formData.get("avatar")
        ? { url: String(formData.get("avatar")), alt: "Avatar" }
        : undefined,
      banner: formData.get("banner")
        ? { url: String(formData.get("banner")), alt: "Banner" }
        : undefined,
    };
    if (msg) msg.textContent = "Registering…";
    try {
      const response = await registerUser(body);
      console.log("Register response:", response);
      // Some APIs don't return accessToken on register; perform auto-login to get token
      const loginRes = await loginUser({
        email: body.email,
        password: body.password,
      });
      setAuth({
        accessToken: loginRes.data.accessToken,
        name: loginRes.data.name,
        email: loginRes.data.email,
      });
      console.log(
        "register.ts: accessToken now in LS?",
        localStorage.getItem("accessToken")
      );
      emitAuthChanged();
      if (msg) msg.textContent = `Registered as ${loginRes.data.name}`;
      history.pushState({ path: "/" }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err: any) {
      if (msg) msg.textContent = err?.message || "Registration failed";
    }
  });
}
