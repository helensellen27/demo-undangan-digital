export function createPublicConfigRuntime(options = {}) {
  const cacheKey = String(options.cacheKey || "wedding_config_cache").trim();
  const cacheTtlMs = Number(options.cacheTtlMs || 0);

  async function fetchWithTimeout(url, fetchOptions = {}, timeoutMs = 7000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error("Koneksi ke server terlalu lama. Silakan coba lagi."));
    }, timeoutMs);

    try {
      return await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("Koneksi ke server terlalu lama. Silakan coba lagi.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function readCachedConfig() {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.savedAt || !parsed.data) return null;
      if (cacheTtlMs > 0 && Date.now() - Number(parsed.savedAt) > cacheTtlMs) return null;
      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  function writeCachedConfig(config) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        savedAt: Date.now(),
        data: config
      }));
    } catch (error) {
      // Abaikan jika storage penuh/terblokir.
    }
  }

  async function loadServerConfig(optionsForLoad = {}) {
    const {
      currentConfig,
      mergeConfig,
      rsvpApiUrl,
      preferCachedConfig = false,
      onFreshConfig
    } = optionsForLoad;

    let hasSheetConfig = false;
    let nextConfig = currentConfig;

    const cachedConfig = readCachedConfig();
    if (cachedConfig) {
      nextConfig = mergeConfig(nextConfig, cachedConfig);
      hasSheetConfig = true;
    }

    if (!rsvpApiUrl || rsvpApiUrl.includes("PASTE_WEB_APP_URL")) {
      return { ok: true, config: nextConfig };
    }

    const url = new URL(rsvpApiUrl);
    url.searchParams.set("action", "config");
    url.searchParams.set("_ts", String(Date.now()));

    async function fetchFreshConfig(baseConfig) {
      let freshConfig = baseConfig;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await fetchWithTimeout(url.toString(), {
            cache: "no-store"
          }, 10000);

          const result = await response.json();
          if (response.ok && result.success && result.config) {
            freshConfig = mergeConfig(freshConfig, result.config);
            writeCachedConfig(result.config);
            return { ok: true, config: freshConfig };
          }
        } catch (error) {
          // Retry 1x jika koneksi awal lambat.
        }
      }

      return { ok: hasSheetConfig, config: freshConfig };
    }

    if (preferCachedConfig && cachedConfig) {
      fetchFreshConfig(nextConfig).then((freshResult) => {
        if (freshResult.ok && typeof onFreshConfig === "function") {
          onFreshConfig(freshResult.config);
        }
      });
      return { ok: true, config: nextConfig, fromCache: true };
    }

    return fetchFreshConfig(nextConfig);
  }

  return {
    fetchWithTimeout,
    readCachedConfig,
    writeCachedConfig,
    loadServerConfig
  };
}
