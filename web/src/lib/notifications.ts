import pool from "@/lib/db";

export type NotificationType =
  | "new_message"
  | "new_listing"
  | "price_change"
  | "listing_favorited";

interface CreateNotificationParams {
  agentId: number;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  referenceId?: number;
}

/** Create a notification for an agent. Fire-and-forget — errors are logged, not thrown. */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notifications (agent_id, type, title, body, link, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.agentId,
        params.type,
        params.title,
        params.body || null,
        params.link || null,
        params.referenceId || null,
      ],
    );
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

/** Notify listing owner when someone sends a new message */
export async function notifyNewMessage(
  recipientAgentId: number,
  senderName: string,
  listingId: number,
  conversationId: number,
): Promise<void> {
  await createNotification({
    agentId: recipientAgentId,
    type: "new_message",
    title: `Tin nhắn mới từ ${senderName}`,
    link: `/dashboard/listings/${listingId}/view?from=messages#messages`,
    referenceId: conversationId,
  });
}

/** Notify agents in the same area when a new listing is posted */
export async function notifyNewListing(
  listingId: number,
  listingStreet: string | null,
  listingWard: string | null,
  ownerAgentId: number,
): Promise<void> {
  // Notify all agents except the owner
  try {
    const result = await pool.query(
      "SELECT id FROM agents WHERE id != $1",
      [ownerAgentId],
    );
    const title = listingStreet
      ? `BĐS mới: ${listingStreet}`
      : "BĐS mới được đăng";
    const body = listingWard ? `Tại ${listingWard}, Nha Trang` : undefined;

    for (const row of result.rows) {
      await createNotification({
        agentId: row.id,
        type: "new_listing",
        title,
        body,
        link: `/dashboard/listings/${listingId}/view?from=feed`,
        referenceId: listingId,
      });
    }
  } catch (err) {
    console.error("Failed to notify new listing:", err);
  }
}
