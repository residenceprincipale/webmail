export default defineNuxtRouteMiddleware(async () => {
  // Protected pages: redirect anonymous users to /login.
  if (import.meta.server) {
    const cookie = useRequestHeader("cookie") ?? "";
    if (!/(?:^|;\s*)wmsession=/.test(cookie)) return navigateTo("/login");
    return;
  }
  try {
    const res = await $fetch<{ authenticated: boolean }>("/api/auth/logout", { method: "GET" });
    if (!res.authenticated) return navigateTo("/login");
  } catch {
    return navigateTo("/login");
  }
});
