export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    const cookie = useRequestHeader("cookie") ?? "";
    if (/(?:^|;\s*)wmsession=/.test(cookie)) return navigateTo("/");
    return;
  }
  try {
    const res = await $fetch<{ authenticated: boolean }>("/api/auth/logout", { method: "GET" });
    if (res.authenticated) return navigateTo("/");
  } catch {
    return;
  }
});
