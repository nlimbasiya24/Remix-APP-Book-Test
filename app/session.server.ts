// remix-test-app/app/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in environment variables");
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "auth_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

export { getSession, commitSession, destroySession };
