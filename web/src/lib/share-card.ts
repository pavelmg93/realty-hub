import { Listing } from "@/lib/types";
import { formatPrice, generateTitleStandardized } from "@/lib/constants";

const CARD_W = 1080;
const CARD_H = 1350;
const PHOTO_H = 720;
const PAD = 48;

/** Generate a 1080x1350 share card image as a Blob */
export async function generateShareCard(
  listing: Listing,
  photoUrl: string | null,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Photo area
  if (photoUrl) {
    try {
      const img = await loadImage(photoUrl);
      const scale = Math.max(CARD_W / img.width, PHOTO_H / img.height);
      const sw = CARD_W / scale;
      const sh = PHOTO_H / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CARD_W, PHOTO_H);
    } catch {
      ctx.fillStyle = "#2a2a3e";
      ctx.fillRect(0, 0, CARD_W, PHOTO_H);
      ctx.fillStyle = "#666";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No Photo", CARD_W / 2, PHOTO_H / 2);
    }
  } else {
    ctx.fillStyle = "#2a2a3e";
    ctx.fillRect(0, 0, CARD_W, PHOTO_H);
  }

  // Gradient overlay at bottom of photo
  const grad = ctx.createLinearGradient(0, PHOTO_H - 120, 0, PHOTO_H);
  grad.addColorStop(0, "rgba(26,26,46,0)");
  grad.addColorStop(1, "rgba(26,26,46,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, PHOTO_H - 120, CARD_W, 120);

  // Status badge on photo
  if (listing.status && listing.status !== "selling") {
    const statusLabels: Record<string, string> = {
      just_listed: "MỚI",
      price_dropped: "GIẢM GIÁ",
      price_increased: "TĂNG GIÁ",
      deposit: "ĐÃ CỌC",
      sold: "ĐÃ BÁN",
      not_for_sale: "KHÔNG BÁN",
    };
    const statusColors: Record<string, string> = {
      just_listed: "#3b82f6",
      price_dropped: "#ef4444",
      price_increased: "#ef4444",
      deposit: "#22c55e",
      sold: "#22c55e",
      not_for_sale: "#6b7280",
    };
    const label = statusLabels[listing.status] || "";
    const color = statusColors[listing.status] || "#6b7280";
    if (label) {
      ctx.font = "bold 28px sans-serif";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      roundRect(ctx, PAD, 40, tw + 32, 48, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(label, PAD + 16, 72);
    }
  }

  // Content area below photo
  let y = PHOTO_H + PAD;

  // Street (line 1)
  const street = listing.street || "";
  if (street) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(truncateText(ctx, street, CARD_W - PAD * 2), PAD, y);
    y += 56;
  }

  // Title standardized (line 2)
  const title = listing.title_standardized || generateTitleStandardized(listing);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(truncateText(ctx, title, CARD_W - PAD * 2), PAD, y);
  y += 70;

  // Price
  const priceStr = formatPrice(listing.price_vnd);
  if (priceStr) {
    ctx.fillStyle = "#ff6b35";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(priceStr, PAD, y);
    y += 68;
  }

  // Details line (area, bedrooms, ward)
  const details: string[] = [];
  if (listing.area_m2) details.push(`${listing.area_m2}m²`);
  if (listing.num_bedrooms) details.push(`${listing.num_bedrooms} PN`);
  if (listing.ward) details.push(listing.ward);
  if (details.length > 0) {
    ctx.fillStyle = "#a0a0b8";
    ctx.font = "32px sans-serif";
    ctx.fillText(details.join(" · "), PAD, y);
    y += 48;
  }

  // Divider
  y += 16;
  ctx.strokeStyle = "#3a3a4e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(CARD_W - PAD, y);
  ctx.stroke();
  y += 32;

  // Agent info
  const agentName = [listing.owner_first_name, listing.owner_last_name].filter(Boolean).join(" ");
  if (agentName) {
    ctx.fillStyle = "#d0d0e0";
    ctx.font = "28px sans-serif";
    ctx.fillText(agentName, PAD, y);
    y += 40;
  }
  if (listing.owner_phone) {
    ctx.fillStyle = "#a0a0b8";
    ctx.font = "28px sans-serif";
    ctx.fillText(listing.owner_phone, PAD, y);
  }

  // Branding watermark
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "22px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Wealth Realty", CARD_W - PAD, CARD_H - 30);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
  });
}

/** Generate formatted text for copy-paste to Zalo/Facebook */
export function generateShareText(listing: Listing): string {
  const lines: string[] = [];

  const title = listing.title_standardized || generateTitleStandardized(listing);
  if (listing.street) lines.push(`📍 ${listing.street}`);
  lines.push(`🏠 ${title}`);

  const priceStr = formatPrice(listing.price_vnd);
  if (priceStr) lines.push(`💰 ${priceStr}`);

  const details: string[] = [];
  if (listing.area_m2) details.push(`${listing.area_m2}m²`);
  if (listing.num_bedrooms) details.push(`${listing.num_bedrooms} PN`);
  if (listing.num_floors) details.push(`${listing.num_floors} tầng`);
  if (listing.frontage_m) details.push(`MT ${listing.frontage_m}m`);
  if (details.length) lines.push(`📐 ${details.join(" · ")}`);

  if (listing.ward) lines.push(`📌 ${listing.ward}, Nha Trang`);

  if (listing.description) {
    const desc = listing.description.length > 200
      ? listing.description.substring(0, 200) + "..."
      : listing.description;
    lines.push("");
    lines.push(desc);
  }

  const agentName = [listing.owner_first_name, listing.owner_last_name].filter(Boolean).join(" ");
  if (agentName || listing.owner_phone) {
    lines.push("");
    lines.push("👤 " + [agentName, listing.owner_phone].filter(Boolean).join(" - "));
  }

  return lines.join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
