function buildMusicProxyUrl(fileId, resourceKey, sourceUrl, isLikelyDriveFileId) {
    const rawFileId = String(fileId || "").trim();
    const cleanFileId = isLikelyDriveFileId(rawFileId) ? rawFileId : "";
    const cleanResourceKey = String(resourceKey || "").trim();
    const cleanSourceUrl = String(sourceUrl || "").trim();
    const params = new URLSearchParams();

    if (cleanFileId) params.set("fileId", cleanFileId);
    if (cleanResourceKey) params.set("resourceKey", cleanResourceKey);
    if (!cleanFileId && cleanSourceUrl) params.set("src", cleanSourceUrl);
    if (!params.toString()) return "";

    return `/api/music?${params.toString()}`;
  }

export function createMusicController(options = {}) {
    const {
      musicToggle,
      bgMusic,
      musicState,
      weddingConfig,
      getCurrentConfig,
      getActiveMusicTracks,
      normalizeMusicPlaybackMode,
      extractDriveFileId,
      extractDriveResourceKey,
      isLikelyDriveFileId
    } = options;

    function getAudioSourceCandidates(url) {
      const clean = String(url || "").trim();
      if (!clean) return [];

      const fileId = extractDriveFileId(clean);
      const resourceKey = extractDriveResourceKey(clean);
      const resourceKeySuffix = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : "";
      const isDriveHost = /(?:^|\/\/)(?:drive|docs)\.google\.com/i.test(clean)
        || /(?:^|\/\/)drive\.usercontent\.google\.com/i.test(clean);

      if (/^\/api\/music(?:\?|$)/i.test(clean)) {
        return [clean];
      }

      if (isDriveHost && fileId) {
        const proxyUrl = buildMusicProxyUrl(fileId, resourceKey, clean, isLikelyDriveFileId);
        const candidates = [
          proxyUrl,
          clean,
          `https://drive.google.com/uc?export=download&id=${fileId}${resourceKeySuffix}`,
          `https://docs.google.com/uc?export=download&id=${fileId}${resourceKeySuffix}`,
          `https://drive.google.com/uc?export=view&id=${fileId}${resourceKeySuffix}`,
          `https://drive.usercontent.google.com/download?id=${fileId}&export=download${resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ""}`
        ];

        const unique = [];
        const seen = new Set();
        candidates.forEach((item) => {
          const value = String(item || "").trim();
          if (!value || seen.has(value)) return;
          seen.add(value);
          unique.push(value);
        });
        return unique;
      }

      if (fileId) {
        const proxyUrl = buildMusicProxyUrl(fileId, resourceKey, clean, isLikelyDriveFileId);
        if (proxyUrl) return [proxyUrl, clean].filter(Boolean);
      }

      return [clean];
    }

    function normalizeAudioUrl(url) {
      const candidates = getAudioSourceCandidates(url);
      return candidates[0] || "";
    }

    function setupMusicControl() {
      if (!musicToggle || !bgMusic) {
        return { startMusicFromGesture: async () => false };
      }

      const currentConfig = getCurrentConfig();
      const activeTracks = getActiveMusicTracks(currentConfig);
      musicState.activeTracks = activeTracks;
      musicState.playbackMode = normalizeMusicPlaybackMode(currentConfig.musicPlaybackMode || "ordered");
      musicState.currentTrackIndex = 0;
      let allMusicCandidates = [];
      let primaryCandidateCount = 0;
      let currentMusicCandidateIndex = -1;

      function rebuildCandidateList(trackIndex) {
        const track = musicState.activeTracks[trackIndex];
        const primaryCandidates = track ? getAudioSourceCandidates(track.url) : [];
        const fallbackCandidates = getAudioSourceCandidates(weddingConfig.backgroundMusicUrl);
        const nextCandidates = [];
        const seenCandidate = new Set();
        [...primaryCandidates, ...fallbackCandidates].forEach((item) => {
          const value = String(item || "").trim();
          if (!value || seenCandidate.has(value)) return;
          seenCandidate.add(value);
          nextCandidates.push(value);
        });
        primaryCandidateCount = primaryCandidates.length;
        allMusicCandidates = nextCandidates;
        currentMusicCandidateIndex = -1;
        return nextCandidates;
      }

      function pickNextTrackIndex() {
        if (!musicState.activeTracks.length) return -1;
        if (musicState.playbackMode === "shuffle" && musicState.activeTracks.length > 1) {
          let nextIndex = musicState.currentTrackIndex;
          while (nextIndex === musicState.currentTrackIndex) {
            nextIndex = Math.floor(Math.random() * musicState.activeTracks.length);
          }
          return nextIndex;
        }
        const orderedIndex = musicState.currentTrackIndex + 1;
        return orderedIndex >= musicState.activeTracks.length ? 0 : orderedIndex;
      }

      function loadTrack(trackIndex) {
        const candidates = rebuildCandidateList(trackIndex);
        if (!candidates.length) return false;
        musicState.currentTrackIndex = trackIndex;
        currentMusicCandidateIndex = 0;
        bgMusic.src = candidates[0];
        bgMusic.load();
        return true;
      }

      const hasMusic = Boolean(activeTracks.length);
      if (!hasMusic) {
        musicToggle.disabled = true;
        musicToggle.textContent = "Audio";
        return { startMusicFromGesture: async () => false, normalizeAudioUrl, getAudioSourceCandidates };
      }

      function setPlayingState(isPlaying) {
        musicToggle.textContent = isPlaying ? "Pause" : "Music";
        musicToggle.classList.toggle("is-playing", isPlaying);
      }

      function useMusicCandidate(index) {
        if (index < 0 || index >= allMusicCandidates.length) return false;
        const target = allMusicCandidates[index];
        if (!target) return false;

        currentMusicCandidateIndex = index;
        if (bgMusic.src !== target) {
          bgMusic.src = target;
          bgMusic.load();
        }

        if (index >= primaryCandidateCount) {
          musicToggle.textContent = "Music";
        }
        return true;
      }

      loadTrack(0);

      async function startMusicFromGesture(recursionDepth = 0) {
        if (!bgMusic.src && allMusicCandidates.length) {
          useMusicCandidate(0);
        }

        if (!bgMusic.paused) {
          setPlayingState(true);
          return true;
        }

        try {
          await bgMusic.play();
          if ((bgMusic.currentTime || 0) <= 0.25 && musicState.startSec > 0) {
            seekAudio(musicState.startSec);
          }
          setPlayingState(true);
          return true;
        } catch (error) {
          const switched = useMusicCandidate(currentMusicCandidateIndex + 1);
          if (switched && recursionDepth < allMusicCandidates.length) {
            return startMusicFromGesture(recursionDepth + 1);
          }
          const nextTrackIndex = pickNextTrackIndex();
          if (nextTrackIndex >= 0 && nextTrackIndex !== musicState.currentTrackIndex) {
            const loaded = loadTrack(nextTrackIndex);
            if (loaded && recursionDepth < (allMusicCandidates.length + musicState.activeTracks.length)) {
              return startMusicFromGesture(recursionDepth + 1);
            }
          }
          setPlayingState(false);
          musicToggle.textContent = "Audio";
          return false;
        }
      }

      function parseAudioSecond(value) {
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0) return null;
        return num;
      }

      const parsedStart = parseAudioSecond(currentConfig.musicStartSec);
      const parsedLoopStart = parseAudioSecond(currentConfig.musicLoopStartSec);
      const parsedLoopEnd = parseAudioSecond(currentConfig.musicLoopEndSec);

      musicState.startSec = parsedStart ?? (parsedLoopStart ?? 0);
      musicState.loopStartSec = parsedLoopStart;
      musicState.loopEndSec = parsedLoopEnd;

      const hasSegmentLoop = (
        musicState.activeTracks.length <= 1 &&
        musicState.loopStartSec !== null &&
        musicState.loopEndSec !== null &&
        musicState.loopEndSec > musicState.loopStartSec
      );
      bgMusic.loop = musicState.activeTracks.length <= 1 && !hasSegmentLoop;

      function seekAudio(second) {
        const target = Number(second);
        if (!Number.isFinite(target) || target <= 0) return;
        try {
          const maxDuration = Number.isFinite(bgMusic.duration) ? bgMusic.duration : null;
          const safeTarget = maxDuration
            ? Math.min(target, Math.max(0, maxDuration - 0.25))
            : target;
          if (safeTarget > 0) bgMusic.currentTime = safeTarget;
        } catch (error) {
          // Skip seek jika metadata belum siap / browser menolak seek saat ini.
        }
      }

      const applyInitialOffset = () => seekAudio(musicState.startSec);

      bgMusic.addEventListener("loadedmetadata", applyInitialOffset);
      if (bgMusic.readyState >= 1) applyInitialOffset();

      bgMusic.addEventListener("timeupdate", () => {
        if (!hasSegmentLoop) return;

        const loopStart = Math.max(0, musicState.loopStartSec || 0);
        const loopEnd = Math.max(loopStart + 0.1, musicState.loopEndSec || 0);
        const current = bgMusic.currentTime || 0;

        if (current >= loopEnd) {
          bgMusic.currentTime = loopStart;
          if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
          }
        }
      });

      setPlayingState(false);

      musicToggle.addEventListener("click", async () => {
        if (bgMusic.paused) {
          await startMusicFromGesture();
        } else {
          bgMusic.pause();
          setPlayingState(false);
        }
      });

      bgMusic.addEventListener("ended", async () => {
        if (musicState.activeTracks.length > 1) {
          const nextTrackIndex = pickNextTrackIndex();
          if (nextTrackIndex >= 0) {
            const loaded = loadTrack(nextTrackIndex);
            if (loaded) {
              const started = await startMusicFromGesture();
              if (started) return;
            }
          }
        }
        setPlayingState(false);
      });

      bgMusic.addEventListener("error", () => {
        const nextIndex = currentMusicCandidateIndex + 1;
        const switched = useMusicCandidate(nextIndex);
        musicToggle.textContent = switched ? musicToggle.textContent : "Audio";
      });

      return {
        startMusicFromGesture,
        normalizeAudioUrl,
        getAudioSourceCandidates
      };
    }

    return {
      buildMusicProxyUrl: (fileId, resourceKey, sourceUrl) => buildMusicProxyUrl(fileId, resourceKey, sourceUrl, isLikelyDriveFileId),
      normalizeAudioUrl,
      getAudioSourceCandidates,
      setupMusicControl
    };
}
