import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type Profile = {
  login: string;
  displayName: string;
  photo: string | null;
};

const MAX_PHOTO_CHARS = 450_000;
const DIR = process.env.WEBMAIL_PROFILE_DIR ?? join(process.cwd(), ".profiles");

function fileFor(login: string): string {
  return join(DIR, `${encodeURIComponent(login)}.json`);
}

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function readProfile(login: string): Profile {
  try {
    const p = JSON.parse(readFileSync(fileFor(login), "utf8")) as Profile;
    return {
      login,
      displayName: typeof p.displayName === "string" ? p.displayName : "",
      photo: typeof p.photo === "string" ? p.photo : null,
    };
  } catch {
    return { login, displayName: "", photo: null };
  }
}

export function writeProfile(p: Profile): Profile {
  ensureDir();
  const photo = p.photo && p.photo.length <= MAX_PHOTO_CHARS ? p.photo : null;
  const saved: Profile = { login: p.login, displayName: p.displayName, photo };
  writeFileSync(fileFor(p.login), JSON.stringify(saved, null, 2), "utf8");
  return saved;
}

export function displayNameOf(login: string): string {
  return readProfile(login).displayName || login;
}
