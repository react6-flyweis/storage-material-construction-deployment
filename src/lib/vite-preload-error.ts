
import * as Sentry from "@sentry/react";

const STORAGE_KEY = "vite_chunk_preload_reload_tracker";

const MAX_RELOAD_ATTEMPTS = 2;
const RESET_WINDOW_MS = 30_000;

interface ReloadTracker {
  count: number;
  firstAttemptAt: number;
}

function getReloadTracker(): ReloadTracker {
  const now = Date.now();

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { count: 0, firstAttemptAt: now };
    }

    const data = JSON.parse(raw) as ReloadTracker;

    // Validate stored data before trusting it.
    if (
      !Number.isInteger(data.count) ||
      data.count < 0 ||
      !Number.isFinite(data.firstAttemptAt)
    ) {
      return { count: 0, firstAttemptAt: now };
    }

    // Reset the retry window after it expires.
    if (now - data.firstAttemptAt > RESET_WINDOW_MS) {
      return { count: 0, firstAttemptAt: now };
    }

    return data;
  } catch {
    return { count: 0, firstAttemptAt: now };
  }
}

function updateReloadTracker(tracker: ReloadTracker): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
  } catch {
    // Storage may be unavailable. The in-memory fallback
    // below still limits reload attempts in this page instance.
  }
}

function clearReloadTracker(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function reportPreloadError(
  error: unknown,
  attempts: number,
): void {
  console.warn(
    `[Vite Preload Error] Chunk load failed (attempt ${attempts}/${MAX_RELOAD_ATTEMPTS}).`,
    error,
  );

  // Do not send development errors to Sentry.
  if (!import.meta.env.PROD) {
    return;
  }

  const context = {
    tags: {
      type: "chunk_load_error",
    },
    extra: {
      attempt: attempts,
      currentUrl: window.location.href,
      referrer: document.referrer,
    },
  };

  if (error instanceof Error) {
    Sentry.captureException(error, context);
  } else {
    Sentry.captureMessage("Vite dynamic chunk preload failed", {
      ...context,
      level: "warning",
      extra: {
        ...context.extra,
        error: String(error),
      },
    });
  }
}

if (typeof window !== "undefined") {
  // Fallback counter for environments where sessionStorage fails.
  let memoryReloadCount = 0;
  let memoryFirstAttemptAt = Date.now();

  window.addEventListener("vite:preloadError", (event: Event) => {
    // Prevent Vite's default preload-error handling.
    event.preventDefault();
    const payload =
      (event as { payload?: unknown })?.payload ??
      (event as CustomEvent)?.detail;
    const now = Date.now();

    let tracker: ReloadTracker;

    try {
      // Use sessionStorage as the primary source of truth.
      tracker = getReloadTracker();
    } catch {
      // Defensive fallback.
      tracker = {
        count: memoryReloadCount,
        firstAttemptAt: memoryFirstAttemptAt,
      };
    }

    // Reset the in-memory fallback when its time window expires.
    if (now - memoryFirstAttemptAt > RESET_WINDOW_MS) {
      memoryReloadCount = 0;
      memoryFirstAttemptAt = now;
    }

    // Use the larger count to avoid accidentally lowering the limit.
    const attempts = Math.max(tracker.count, memoryReloadCount) + 1;

    reportPreloadError(payload, attempts);

    if (attempts <= MAX_RELOAD_ATTEMPTS) {
      const nextTracker: ReloadTracker = {
        count: attempts,
        firstAttemptAt:
          tracker.count > 0 ? tracker.firstAttemptAt : now,
      };

      memoryReloadCount = attempts;
      memoryFirstAttemptAt = nextTracker.firstAttemptAt;

      updateReloadTracker(nextTracker);

      // Reload to obtain the latest HTML and chunk references.
      window.location.reload();
      return;
    }

    console.error(
      "[Vite Preload Error] Automatic reload limit reached.",
    );

    // Stop automatic reloads. Let the user decide what to do.
    if (
      window.confirm(
        "The application could not load correctly. " +
          "This may be due to a new deployment or a network issue. " +
          "Would you like to try refreshing the page?",
      )
    ) {
      clearReloadTracker();

      // Preserve the pathname, query string, and hash.
      window.location.reload();
    }
  });
}
