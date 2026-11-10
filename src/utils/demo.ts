import type { Role } from "@prisma/client";

// The seeded demo accounts (the one-click logins and the listings' landlords)
// use example.com, a reserved domain with no mailboxes.
export const DEMO_EMAIL_DOMAIN = "@example.com";

export const isDemoEmail = (email: string) =>
  email.toLowerCase().endsWith(DEMO_EMAIL_DOMAIN);

// Anyone can log in as the Demo Admin, so it is a sandbox: it sees only demo
// data, and its changes are never written to the database.
export const isDemoAdmin = (user: { email: string; role: Role }) =>
  user.role === "ADMIN" && isDemoEmail(user.email);
