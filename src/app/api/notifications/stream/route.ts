import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { getUnreadCount } from "../../../../../backend/repositories/notification.repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hospitalId = user.hospitalId;
  if (!hospitalId) {
    return new Response("No hospital context", { status: 400 });
  }

  const url = new URL(req.url);
  const typesParam = url.searchParams.get("types");
  const types = typesParam ? typesParam.split(",").filter(Boolean) : undefined;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial count immediately
      try {
        const count = await getUnreadCount(hospitalId, {
          userId: user.userId,
          role: user.role,
          types,
        });
        send({ unread: count });
      } catch {
        send({ unread: 0 });
      }

      // Poll every 5 seconds
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const count = await getUnreadCount(hospitalId, {
            userId: user.userId,
            role: user.role,
            types,
          });
          send({ unread: count });
        } catch {
          // ignore DB errors mid-stream
        }
      }, 5000);

      // Heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
          clearInterval(heartbeat);
          clearInterval(interval);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
