import { config, hasTwitterCreds } from "@/lib/config";
import { demoTwitterActions } from "@/lib/demo";
import { realCreatedAt } from "@/lib/tip-policy";
import type { TwitterAction, TwitterClient, TwitterOAuthTokens } from "@/types";

const BULL = "🐂";
const LFG = /lfg/i;

function hasBullEmoji(text?: string): boolean {
  return Boolean(text && text.includes(BULL));
}

/** Comments only tip when they contain "lfg" (any case). Bull emoji super-tips regardless. */
function hasLfg(text?: string): boolean {
  return Boolean(text && LFG.test(text));
}

/** Per-tipper trigger match: case-insensitive substring; emoji triggers work as plain includes. */
function matchesTrigger(text?: string | null, trigger?: string | null): boolean {
  if (!text || !trigger?.trim()) return false;
  return text.toLowerCase().includes(trigger.trim().toLowerCase());
}

/**
 * X API v2 client.
 * Prefer per-tipper user-context OAuth access tokens (stored after Privy login)
 * for liked_tweets / following. Fall back to app bearer where the API allows.
 */
export function createTwitterClient(userAccessToken?: string | null): TwitterClient {
  if (userAccessToken) {
    return createLiveTwitterClient(userAccessToken, "user");
  }
  if (!hasTwitterCreds()) {
    return createDemoTwitterClient();
  }
  return createLiveTwitterClient(config.twitterBearerToken, "app");
}

function createDemoTwitterClient(): TwitterClient {
  return {
    async getUserByUsername(username) {
      const u = username.replace(/^@/, "").toLowerCase();
      return { id: `demo_x_${u}`, username: u };
    },
    async listRecentLikes() {
      return demoTwitterActions().filter((a) => a.actionType === "like");
    },
    async listRecentReplies() {
      return demoTwitterActions().filter((a) => a.actionType === "comment");
    },
    async listRecentQuotes() {
      return demoTwitterActions().filter((a) => a.actionType === "quote");
    },
    async listRecentFollows() {
      return demoTwitterActions().filter((a) => a.actionType === "follow");
    },
    async pingLowBalance(username, balance) {
      console.warn(
        `[DEMO][X-BOT] Low balance ping → @${username}: deposited=${balance}`
      );
    },
  };
}

function createLiveTwitterClient(
  bearer: string,
  mode: "user" | "app"
): TwitterClient {
  const headers = {
    Authorization: `Bearer ${bearer}`,
    "Content-Type": "application/json",
  };

  async function xGet<T>(path: string): Promise<T> {
    const res = await fetch(`https://api.twitter.com/2${path}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`X API ${res.status} (${mode}): ${body}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async getUserByUsername(username) {
      const u = username.replace(/^@/, "");
      const data = await xGet<{ data?: { id: string; username: string } }>(
        `/users/by/username/${encodeURIComponent(u)}?user.fields=username`
      );
      return data.data ?? null;
    },

    async listRecentLikes(userId) {
      // liked_tweets requires user-context OAuth (like.read). App bearer often 403s.
      const qs = new URLSearchParams({
        max_results: "20",
        "tweet.fields": "author_id,created_at",
        expansions: "author_id",
      });
      const data = await xGet<{
        data?: Array<{ id: string; author_id?: string; created_at?: string }>;
        includes?: { users?: Array<{ id: string; username: string }> };
      }>(`/users/${userId}/liked_tweets?${qs}`);

      const users = new Map(
        (data.includes?.users ?? []).map((u) => [u.id, u.username])
      );
      return (data.data ?? []).map((t) => ({
        actionId: `like_${t.id}`,
        actionType: "like" as const,
        tipperXId: userId,
        tipperUsername: "",
        targetXId: t.author_id,
        targetUsername: (t.author_id && users.get(t.author_id)) || "unknown",
        createdAt: realCreatedAt(t.created_at),
      }));
    },

    async listRecentReplies(userId) {
      const data = await xGet<{
        data?: Array<{
          id: string;
          text: string;
          created_at?: string;
          in_reply_to_user_id?: string;
        }>;
        includes?: { users?: Array<{ id: string; username: string }> };
      }>(
        `/tweets/search/recent?query=from:${userId} is:reply&tweet.fields=created_at,in_reply_to_user_id,text&expansions=in_reply_to_user_id&max_results=20`
      );
      const users = new Map(
        (data.includes?.users ?? []).map((u) => [u.id, u.username])
      );
      return (data.data ?? []).map((t) => {
        const text = t.text ?? "";
        return {
          actionId: `comment_${t.id}`,
          actionType: "comment" as const,
          tipperXId: userId,
          tipperUsername: "",
          targetXId: t.in_reply_to_user_id,
          targetUsername:
            (t.in_reply_to_user_id && users.get(t.in_reply_to_user_id)) ||
            "unknown",
          text,
          hasBullEmoji: hasBullEmoji(text),
          createdAt: realCreatedAt(t.created_at),
        } satisfies TwitterAction;
      });
    },

    async listRecentQuotes(userId) {
      const data = await xGet<{
        data?: Array<{
          id: string;
          text: string;
          created_at?: string;
          referenced_tweets?: Array<{ type: string; id: string }>;
        }>;
        includes?: {
          tweets?: Array<{ id: string; author_id?: string }>;
          users?: Array<{ id: string; username: string }>;
        };
      }>(
        `/tweets/search/recent?query=from:${userId} is:quote&tweet.fields=created_at,text,referenced_tweets&expansions=referenced_tweets.id.author_id&user.fields=username&max_results=20`
      );
      const users = new Map(
        (data.includes?.users ?? []).map((u) => [u.id, u.username])
      );
      const tweets = new Map(
        (data.includes?.tweets ?? []).map((t) => [t.id, t])
      );
      return (data.data ?? []).map((t) => {
        const text = t.text ?? "";
        const quoted = t.referenced_tweets?.find((r) => r.type === "quoted");
        const quotedTweet = quoted ? tweets.get(quoted.id) : undefined;
        const targetXId = quotedTweet?.author_id;
        return {
          actionId: `quote_${t.id}`,
          actionType: "quote" as const,
          tipperXId: userId,
          tipperUsername: "",
          targetXId,
          targetUsername: (targetXId && users.get(targetXId)) || "unknown",
          text,
          hasBullEmoji: hasBullEmoji(text),
          createdAt: realCreatedAt(t.created_at),
        } satisfies TwitterAction;
      });
    },

    async listRecentFollows(userId) {
      const data = await xGet<{
        data?: Array<{ id: string; username: string }>;
      }>(`/users/${userId}/following?max_results=20`);
      return (data.data ?? []).map((u) => ({
        actionId: `follow_${userId}_${u.id}`,
        actionType: "follow" as const,
        tipperXId: userId,
        tipperUsername: "",
        targetXId: u.id,
        targetUsername: u.username,
        // Display-only. Poller must not treat this as a real follow time.
        createdAt: new Date().toISOString(),
        createdAtIsSynthetic: true,
      }));
    },

    async pingLowBalance(username, balance) {
      console.warn(
        `[X-BOT] Low balance alert for @${username}: ${balance} $ansem. ` +
          (config.twitterBotUserId
            ? `bot=${config.twitterBotUserId}`
            : "Configure TWITTER_BOT_USER_ID + user auth for DMs.")
      );
    },
  };
}

/**
 * Refresh an X OAuth 2.0 user access token using TWITTER_CLIENT_ID/SECRET.
 * Returns null if refresh is not configured or fails.
 */
export async function refreshTwitterUserToken(
  refreshToken: string
): Promise<TwitterOAuthTokens | null> {
  const clientId = process.env.TWITTER_CLIENT_ID || "";
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || "";
  if (!clientId || !refreshToken) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (clientSecret) {
      headers.Authorization =
        "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    }
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[twitter] refresh failed", res.status, text.slice(0, 200));
      return null;
    }
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt:
        typeof data.expires_in === "number"
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
    };
  } catch (e) {
    console.error("[twitter] refresh error", e);
    return null;
  }
}

export { hasBullEmoji, hasLfg, matchesTrigger, BULL };
