import { waitUntil } from "@vercel/functions";

// Runs work after the response has been sent. On Vercel, waitUntil keeps the
// function alive until it finishes; on a normal server the promise just runs.
// Failures are logged, never thrown at the request that started the work.
export const runInBackground = (label: string, work: () => Promise<unknown>) => {
  waitUntil(
    work().catch((error) => {
      console.warn(`${label} failed: ${error instanceof Error ? error.message : String(error)}`);
    }),
  );
};
