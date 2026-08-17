import { config } from "@/lib/config";

/**
 * Telegram fallback for alerts until the X bot exists (oracle pattern).
 * No-op when TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are unset.
 */
export async function sendTelegramAlert(text: string): Promise<boolean> {
  if (!config.telegramBotToken || !config.telegramChatId) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: config.telegramChatId, text }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.warn("[telegram] alert failed", res.status, (await res.text()).slice(0, 200));
    }
    return res.ok;
  } catch (e) {
    console.warn("[telegram] alert error", e instanceof Error ? e.message : e);
    return false;
  }
}
