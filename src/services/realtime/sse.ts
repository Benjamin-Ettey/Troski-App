import type { Response } from "express";

/**
 * Minimal in-process Server-Sent Events (SSE) hub. SSE is a one-way stream from
 * server to client over plain HTTP — perfect for pushing live van positions and
 * "head to pickup" alerts without a WebSocket tunnel. Clients (driver GPS,
 * passenger accept) still talk back over normal HTTP requests.
 *
 * Single-node: subscribers live in this process's memory. Going multi-instance
 * later needs a Redis pub/sub backplane so an event published on one node
 * reaches a client connected to another — that's the scale-time upgrade.
 */

const channels = new Map<string, Set<Response>>();

/** Channel name for a booking's live-tracking stream. */
export const bookingChannel = (bookingId: string): string =>
  `booking:${bookingId}`;

const writeEvent = (res: Response, event: string, data: unknown): void => {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Broken pipe — the client went away; close handler will clean it up.
  }
};

/** Attach an HTTP response as an SSE subscriber on a channel. */
export const subscribe = (channel: string, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable proxy buffering
  res.flushHeaders?.();
  res.write(`: connected\n\n`);

  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(res);

  res.on("close", () => {
    const s = channels.get(channel);
    if (!s) return;
    s.delete(res);
    if (!s.size) channels.delete(channel);
  });
};

/** Push an event to every subscriber on a channel. */
export const publish = (channel: string, event: string, data: unknown): void => {
  const set = channels.get(channel);
  if (!set) return;
  for (const res of set) writeEvent(res, event, data);
};

/** Push an event to a single response (e.g. an initial snapshot on connect). */
export const sendTo = (res: Response, event: string, data: unknown): void =>
  writeEvent(res, event, data);

export const subscriberCount = (channel: string): number =>
  channels.get(channel)?.size ?? 0;

// Heartbeat comment keeps idle connections alive through proxies. unref() so it
// never holds the process (or tests) open.
const HEARTBEAT_MS = 25000;
setInterval(() => {
  for (const set of channels.values()) {
    for (const res of set) {
      try {
        res.write(`: ping\n\n`);
      } catch {
        // ignore; close handler cleans up
      }
    }
  }
}, HEARTBEAT_MS).unref();
