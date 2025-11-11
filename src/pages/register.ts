import { registerUser, loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";

const outletId = "app-content";

export function renderRegister() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
  <section class="flex justify-center items-center min-h-screen  mx-auto">
    <form class="flex flex-col gap-2 w-full max-w-2xl mx-auto bg-(--panel) backdrop-blur-md border border-blue-500 p-6 rounded-2xl shadow-md text-white" id="register-form">
      <h1 class="flex justify-center text-xl font-bold mb-4">Register</h1>
      <div class="mb-4">
        <label for="username" class="flex flex-col">Username <input class="border rounded-2xl p-1 text-black bg-gray-100" name="name" required pattern="[A-Za-z0-9_]+" title="Letters, numbers and underscore only"></label><br>
      </div>
      <div class="mb-4">
        <label class="flex flex-col">Email <input class="border rounded-2xl p-1 text-black bg-gray-100" name="email" type="email" required></label><br>
      </div>
      <div class="mb-4">
        <label class="flex flex-col">Password <input class="border rounded-2xl p-1 text-black bg-gray-100" name="password" type="password" minlength="8" required></label><br>
      </div>
      <div class="mb-4">
        <label class="flex flex-col">Avatar URL <input class="border rounded-2xl p-1 text-black bg-gray-100" name="avatar" type="url" placeholder="https://..."></label><br>
      </div>
      <div class="mb-4">
        <label class="flex flex-col">Banner URL <input class="border rounded-2xl p-1 text-black bg-gray-100" name="banner" type="url" placeholder="https://..."></label><br>
      </div>
      <div class="flex mb-3">
        <input id="checkbox-2" type="checkbox" required value="" class="w-auto h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" >
        <label for="checkbox-2" class="ms-2 text-sm font-medium text-white">I agree to the <a href="#" class="text-blue-600 hover:underline dark:text-blue-500">terms and conditions</a>.</label>
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white font-bold py-2 px-4 rounded-2xl" type="submit">Create account</button>

	  </form>
  </section>
	<p id="register-msg"></p>
	`;

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
