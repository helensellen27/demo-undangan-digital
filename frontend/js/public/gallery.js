export function createGalleryController(options = {}) {
    const {
      galleryGrid,
      lightbox,
      lightboxImg,
      galleryState,
      isMobileViewport,
      weddingConfig,
      getCurrentConfig,
      normalizeCountString,
      normalizeGalleryMode,
      normalizeGalleryStyle,
      normalizePositiveNumberString,
      getGalleryObjectPosition,
      extractDriveFileId
    } = options;

    function normalizeGalleryUrl(url, purpose = "gallery") {
      const clean = String(url || "").trim();
      if (!clean) return "";

      const fileId = extractDriveFileId(clean);
      if (clean.includes("drive.google.com") && fileId) {
        return getDriveImageCandidates(fileId, purpose)[0];
      }

      return clean;
    }

    function getImageSizeByPurpose(purpose) {
      if (purpose === "full") return 2400;
      if (purpose === "hero") return isMobileViewport ? 1280 : 1800;
      if (purpose === "story") return isMobileViewport ? 720 : 980;
      return isMobileViewport ? 960 : 1400;
    }

    function getDriveImageCandidates(fileId, purpose = "gallery") {
      const size = getImageSizeByPurpose(purpose);
      return [
        `https://lh3.googleusercontent.com/d/${fileId}=w${size}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`
      ];
    }

    function applyImageWithFallback(img, rawUrl, imageOptions = {}) {
      if (!img) return;

      const fallbackSrc = imageOptions.fallbackSrc || "";
      const purpose = imageOptions.purpose || "gallery";
      const cleanUrl = String(rawUrl || "").trim();
      if (!cleanUrl) {
        if (fallbackSrc) img.src = fallbackSrc;
        return;
      }

      const fileId = extractDriveFileId(cleanUrl);
      const candidates = (cleanUrl.includes("drive.google.com") && fileId)
        ? getDriveImageCandidates(fileId, purpose)
        : [cleanUrl];

      let index = 0;
      const applyNext = () => {
        const nextUrl = String(candidates[index] || "").trim();
        if (!nextUrl) {
          img.onerror = null;
          if (fallbackSrc) img.src = fallbackSrc;
          return;
        }

        index += 1;
        img.src = nextUrl;
      };

      img.onerror = () => {
        if (index >= candidates.length) {
          img.onerror = null;
          if (fallbackSrc) img.src = fallbackSrc;
          return;
        }
        applyNext();
      };

      applyNext();
    }

    function clearGalleryAutoplay() {
      if (!galleryState.autoplayTimer) return;
      window.clearInterval(galleryState.autoplayTimer);
      galleryState.autoplayTimer = null;
    }

    function openGalleryLightbox(src, index) {
      if (!lightbox || !lightboxImg) return;
      const clean = String(src || "").trim();
      if (!clean) return;

      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("gallery-lightbox-open");
      lightboxImg.alt = `Foto galeri ${index + 1} ukuran besar`;
      applyImageWithFallback(lightboxImg, clean, { purpose: "full", fallbackSrc: clean });
    }

    function closeGalleryLightbox() {
      if (!lightbox || !lightboxImg) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("gallery-lightbox-open");
      lightboxImg.removeAttribute("src");
    }

    function createGalleryCard(src, index) {
      const card = document.createElement("article");
      card.className = "gallery-item";
      card.classList.add("is-clickable");

      const img = document.createElement("img");
      img.alt = `Foto galeri ${index + 1}`;
      img.decoding = "async";
      img.loading = index < 4 ? "eager" : "lazy";
      if (index < 2) img.fetchPriority = "high";
      img.style.objectPosition = getGalleryObjectPosition(src);
      img.addEventListener("click", () => openGalleryLightbox(src, index));

      applyImageWithFallback(img, src, {
        purpose: "gallery",
        fallbackSrc: `assets/photos/foto-${(index % 6) + 1}.svg`
      });

      card.appendChild(img);
      return card;
    }

    function renderGalleryCarousel(photos, autoplaySec) {
      const carousel = document.createElement("div");
      carousel.className = "gallery-carousel";

      const track = document.createElement("div");
      track.className = "gallery-carousel-track";
      carousel.appendChild(track);

      const dots = document.createElement("div");
      dots.className = "gallery-dots";
      carousel.appendChild(dots);

      let activeIndex = 0;
      const maxIndex = photos.length - 1;
      const dotButtons = [];

      function updateSlide(nextIndex) {
        activeIndex = Math.max(0, Math.min(nextIndex, maxIndex));
        track.style.transform = `translateX(-${activeIndex * 100}%)`;
        dotButtons.forEach((dot, idx) => dot.classList.toggle("is-active", idx === activeIndex));
      }

      photos.forEach((src, index) => {
        const slide = document.createElement("div");
        slide.className = "gallery-slide";
        slide.appendChild(createGalleryCard(src, index));
        track.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery-dot";
        dot.setAttribute("aria-label", `Foto ${index + 1}`);
        dot.addEventListener("click", () => updateSlide(index));
        dots.appendChild(dot);
        dotButtons.push(dot);
      });

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "gallery-nav gallery-nav-prev";
      prev.textContent = "<";
      prev.setAttribute("aria-label", "Foto sebelumnya");
      prev.addEventListener("click", () => updateSlide(activeIndex <= 0 ? maxIndex : activeIndex - 1));

      const next = document.createElement("button");
      next.type = "button";
      next.className = "gallery-nav gallery-nav-next";
      next.textContent = ">";
      next.setAttribute("aria-label", "Foto berikutnya");
      next.addEventListener("click", () => updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1));

      if (photos.length > 1) {
        carousel.appendChild(prev);
        carousel.appendChild(next);
      }

      updateSlide(0);
      galleryGrid.appendChild(carousel);

      if (photos.length > 1 && autoplaySec > 0) {
        galleryState.autoplayTimer = window.setInterval(() => {
          updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1);
        }, autoplaySec * 1000);

        carousel.addEventListener("mouseenter", clearGalleryAutoplay);
        carousel.addEventListener("mouseleave", () => {
          clearGalleryAutoplay();
          galleryState.autoplayTimer = window.setInterval(() => {
            updateSlide(activeIndex >= maxIndex ? 0 : activeIndex + 1);
          }, autoplaySec * 1000);
        });
      }
    }

    function renderGalleryGrid(photos) {
      if (!galleryGrid) return;
      clearGalleryAutoplay();
      galleryGrid.innerHTML = "";

      const currentConfig = getCurrentConfig();
      const fallbackPhotos = Array.isArray(weddingConfig.galleryPhotos) ? weddingConfig.galleryPhotos : [];
      const sourcePhotos = Array.isArray(photos) && photos.length ? photos : fallbackPhotos;
      const cleanPhotosRaw = sourcePhotos
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      const maxItems = Number(normalizeCountString(currentConfig.galleryMaxItems));
      const cleanPhotos = (Number.isFinite(maxItems) && maxItems > 0)
        ? cleanPhotosRaw.slice(0, maxItems)
        : cleanPhotosRaw;
      const mode = normalizeGalleryMode(currentConfig.galleryMode || weddingConfig.galleryMode);
      const style = normalizeGalleryStyle(currentConfig.galleryStyle || weddingConfig.galleryStyle);

      galleryGrid.dataset.mode = mode;
      galleryGrid.dataset.style = style;
      galleryGrid.dataset.count = String(cleanPhotos.length);

      if (!cleanPhotos.length) {
        galleryGrid.innerHTML = '<p class="gallery-empty">Belum ada foto galeri.</p>';
        return;
      }

      if (mode === "carousel") {
        const autoplaySec = Number(normalizePositiveNumberString(
          currentConfig.galleryAutoplaySec || weddingConfig.galleryAutoplaySec || "3.5"
        )) || 3.5;
        renderGalleryCarousel(cleanPhotos, autoplaySec);
        return;
      }

      cleanPhotos.forEach((src, index) => {
        galleryGrid.appendChild(createGalleryCard(src, index));
      });
    }

    return {
      normalizeGalleryUrl,
      applyImageWithFallback,
      clearGalleryAutoplay,
      openGalleryLightbox,
      closeGalleryLightbox,
      renderGalleryGrid
    };
}
