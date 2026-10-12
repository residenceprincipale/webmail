import { WMSESSION_COOKIE } from "../../utils/session";

export default defineEventHandler((event) => {
  deleteCookie(event, WMSESSION_COOKIE, { path: "/" });
  return { ok: true };
});
