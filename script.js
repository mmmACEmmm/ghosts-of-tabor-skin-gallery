(function () {
  const CARD_ITEM_LIMIT = 15;

  const rawSkins = Array.isArray(window.SKIN_DATA) ? window.SKIN_DATA : [];

  const elements = {
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    resultsLabel: document.getElementById("resultsLabel"),
    sourceFilters: document.getElementById("sourceFilters"),
    cardGrid: document.getElementById("cardGrid"),
    detailModal: document.getElementById("detailModal"),
    closeModal: document.getElementById("closeModal"),
    modalPrev: document.getElementById("modalPrev"),
    modalNext: document.getElementById("modalNext"),
    modalImage: document.getElementById("modalImage"),
    modalImageCount: document.getElementById("modalImageCount"),
    modalSource: document.getElementById("modalSource"),
    modalTitle: document.getElementById("modalTitle"),
    modalSummary: document.getElementById("modalSummary"),
    modalMeta: document.getElementById("modalMeta"),
    modalThumbs: document.getElementById("modalThumbs"),
    modalItems: document.getElementById("modalItems"),
  };

  const state = {
    search: "",
    source: "All",
    sort: "featured",
    activeSlug: null,
    activeImage: null,
  };

  function encodeAssetPath(path) {
    const rawValue = String(path || "");
    const queryIndex = rawValue.indexOf("?");
    const basePath = queryIndex >= 0 ? rawValue.slice(0, queryIndex) : rawValue;
    const query = queryIndex >= 0 ? rawValue.slice(queryIndex) : "";

    return (
      basePath
        .split("/")
        .map(encodeURIComponent)
        .join("/") + query
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function getSourceGroup(entry) {
    const sourceType = (entry.sourceType || "").trim();
    const sourceValue = (entry.sourceValue || "").trim();

    if (/^dlc$/i.test(sourceType)) {
      return "DLC";
    }

    return sourceValue || sourceType || "Unknown";
  }

  function renderItemTags(items, limit) {
    if (!items.length) {
      return `<span class="tag">No compatible items listed</span>`;
    }

    const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;
    const hiddenCount = typeof limit === "number" ? Math.max(0, items.length - limit) : 0;
    const tags = visibleItems.map((item) => `<span class="tag">${escapeHtml(item)}</span>`);

    if (hiddenCount > 0) {
      tags.push(`<span class="tag tag-muted">etc. +${hiddenCount} more</span>`);
    }

    return tags.join("");
  }

  function getCardItemSummary(count) {
    if (count > CARD_ITEM_LIMIT) {
      return `${CARD_ITEM_LIMIT}+ compatible items`;
    }

    return pluralize(count, "compatible item", "compatible items");
  }

  function getDetailImages(skin) {
    if (!skin) {
      return [];
    }

    if (skin.detailImages.length) {
      return skin.detailImages;
    }

    return skin.displayImage ? [skin.displayImage] : [];
  }

  function normalizeSkin(entry) {
    const galleryImages = Array.isArray(entry.galleryImages) ? entry.galleryImages.filter(Boolean) : [];
    const usableGallery = galleryImages.filter((path) => !/placeholder/i.test(path));
    const detailImages = unique([entry.coverImage, ...usableGallery]);
    const displayImage = entry.coverImage || usableGallery[0] || "";
    const sourceGroup = getSourceGroup(entry);
    const searchableText = [
      entry.name,
      entry.sourceLabel,
      entry.sourceType,
      entry.sourceValue,
      ...(entry.compatibleItems || []),
    ]
      .join(" ")
      .toLowerCase();

    return {
      ...entry,
      compatibleItems: Array.isArray(entry.compatibleItems) ? entry.compatibleItems : [],
      galleryImages,
      usableGallery,
      detailImages,
      displayImage,
      previewCount: usableGallery.length,
      sourceGroup,
      searchableText,
      featuredScore: (entry.itemCount || 0) * 4 + usableGallery.length * 3 + (entry.sourceValue ? 1 : 0),
      isIncomplete: !entry.sourceValue || !entry.itemCount || entry.hasPlaceholderPreview || !usableGallery.length,
    };
  }

  const skins = rawSkins.map(normalizeSkin);

  const sourceCounts = skins.reduce((map, skin) => {
    map.set(skin.sourceGroup, (map.get(skin.sourceGroup) || 0) + 1);
    return map;
  }, new Map());

  const filters = [
    { value: "All", label: "All sources", count: skins.length },
    ...Array.from(sourceCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([value, count]) => ({ value, label: value, count })),
  ];

  function renderFilters() {
    elements.sourceFilters.innerHTML = filters
      .map(
        (filter) => `
          <button
            class="source-chip${filter.value === state.source ? " active" : ""}"
            type="button"
            data-source="${escapeHtml(filter.value)}"
          >
            ${escapeHtml(filter.label)} <span>${escapeHtml(filter.count)}</span>
          </button>
        `
      )
      .join("");
  }

  function getFilteredSkins() {
    const search = state.search.trim().toLowerCase();

    return skins.filter((skin) => {
      const matchesSource = state.source === "All" || skin.sourceGroup === state.source;
      const matchesSearch = !search || skin.searchableText.includes(search);
      return matchesSource && matchesSearch;
    });
  }

  function sortSkins(list) {
    const sorted = [...list];

    if (state.sort === "items") {
      sorted.sort((left, right) => right.itemCount - left.itemCount || left.name.localeCompare(right.name));
    } else if (state.sort === "previews") {
      sorted.sort((left, right) => right.previewCount - left.previewCount || right.itemCount - left.itemCount || left.name.localeCompare(right.name));
    } else if (state.sort === "name") {
      sorted.sort((left, right) => left.name.localeCompare(right.name));
    } else {
      sorted.sort((left, right) => right.featuredScore - left.featuredScore || left.name.localeCompare(right.name));
    }

    return sorted;
  }

  function renderToolbarState(filtered) {
    const trimmedSearch = state.search.trim();
    const resultPrefix =
      filtered.length === skins.length
        ? `${pluralize(filtered.length, "pack", "packs")} shown`
        : `Showing ${filtered.length} of ${skins.length} packs`;

    elements.resultsLabel.textContent =
      resultPrefix +
      (state.source !== "All" ? ` in ${state.source}` : "") +
      (trimmedSearch ? ` for "${trimmedSearch}"` : "") +
      ".";
  }

  function renderGrid() {
    const filtered = sortSkins(getFilteredSkins());
    renderToolbarState(filtered);

    if (!filtered.length) {
      elements.cardGrid.innerHTML = `
        <div class="empty-state">
          <p>No skin packs match this filter combination.</p>
          <p>Try a broader source filter or search for a different compatible item.</p>
        </div>
      `;
      return;
    }

    elements.cardGrid.innerHTML = filtered
      .map((skin, index) => {
        const previewLabel = skin.previewCount
          ? `${skin.previewCount} preview${skin.previewCount === 1 ? "" : "s"} ready`
          : skin.hasPlaceholderPreview
            ? "Preview pending"
            : "No preview";

        const itemTags = renderItemTags(skin.compatibleItems, CARD_ITEM_LIMIT);

        return `
          <article class="skin-card card-stagger" style="animation-delay:${index * 30}ms">
            <button class="skin-card-hit" type="button" data-slug="${escapeHtml(skin.slug)}">
              <div class="card-media">
                <img src="${encodeAssetPath(skin.displayImage)}" alt="${escapeHtml(skin.name)} image">
                <div class="card-overlay">
                  <span class="overlay-pill">${escapeHtml(skin.sourceGroup)}</span>
                </div>
              </div>

              <div class="card-body">
                <div class="card-header">
                  <h3>${escapeHtml(skin.name)}</h3>
                </div>

                <div class="card-meta">
                  <span class="meta-pill">${escapeHtml(getCardItemSummary(skin.itemCount))}</span>
                  <span class="meta-pill">${escapeHtml(previewLabel)}</span>
                </div>

                <div class="card-tags">
                  ${itemTags}
                </div>
              </div>
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderModalMedia(skin) {
    const detailImages = getDetailImages(skin);
    const currentIndex = Math.max(0, detailImages.indexOf(state.activeImage));
    const safeIndex = detailImages.length ? currentIndex : -1;
    const activeImage = safeIndex >= 0 ? detailImages[safeIndex] : skin.displayImage;
    const hasMultipleImages = detailImages.length > 1;

    state.activeImage = activeImage;
    elements.modalImage.src = encodeAssetPath(activeImage);
    elements.modalImage.alt = `${skin.name} detail view`;
    elements.modalImageCount.textContent = detailImages.length ? `${safeIndex + 1} / ${detailImages.length}` : "";
    elements.modalPrev.hidden = !hasMultipleImages;
    elements.modalNext.hidden = !hasMultipleImages;
    elements.modalThumbs.hidden = !hasMultipleImages;

    elements.modalThumbs.innerHTML = detailImages
      .map((path) => {
        const activeClass = path === state.activeImage ? " active" : "";
        return `
          <button
            class="thumbnail-button${activeClass}"
            type="button"
            data-slug="${escapeHtml(skin.slug)}"
            data-image="${escapeHtml(path)}"
          >
            <img src="${encodeAssetPath(path)}" alt="${escapeHtml(skin.name)} thumbnail">
          </button>
        `;
      })
      .join("");
  }

  function openModal(slug, imagePath) {
    const skin = skins.find((entry) => entry.slug === slug);
    if (!skin) return;

    state.activeSlug = slug;
    state.activeImage = imagePath || getDetailImages(skin)[0] || skin.displayImage;

    elements.modalSource.textContent = skin.sourceLabel;
    elements.modalTitle.textContent = skin.name;
    elements.modalSummary.textContent =
      `${pluralize(skin.itemCount, "compatible item", "compatible items")} across this pack. ` +
      `${skin.previewCount ? `${pluralize(skin.previewCount, "gathered preview is", "gathered previews are")} available.` : skin.hasPlaceholderPreview ? "A placeholder preview exists, but no real preview has been gathered yet." : "No preview image has been gathered yet."}`;

    elements.modalMeta.innerHTML = [
      `${pluralize(skin.itemCount, "compatible item", "compatible items")}`,
      `${pluralize(skin.previewCount, "real preview", "real previews")}`,
    ]
      .map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`)
      .join("");

    elements.modalItems.innerHTML = renderItemTags(skin.compatibleItems);
    renderModalMedia(skin);

    elements.detailModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function changeModalImage(direction) {
    const skin = skins.find((entry) => entry.slug === state.activeSlug);
    if (!skin) return;

    const detailImages = getDetailImages(skin);
    if (detailImages.length < 2) return;

    const currentIndex = Math.max(0, detailImages.indexOf(state.activeImage));
    const nextIndex = (currentIndex + direction + detailImages.length) % detailImages.length;
    state.activeImage = detailImages[nextIndex];
    renderModalMedia(skin);
  }

  function closeModal() {
    elements.detailModal.hidden = true;
    document.body.style.overflow = "";
  }

  elements.searchInput.addEventListener("input", function (event) {
    state.search = event.target.value;
    renderGrid();
  });

  elements.sortSelect.addEventListener("change", function (event) {
    state.sort = event.target.value;
    renderGrid();
  });

  elements.sourceFilters.addEventListener("click", function (event) {
    const button = event.target.closest("[data-source]");
    if (!button) return;
    state.source = button.dataset.source || "All";
    renderFilters();
    renderGrid();
  });

  elements.cardGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-slug]");
    if (!button) return;
    openModal(button.dataset.slug);
  });

  elements.modalThumbs.addEventListener("click", function (event) {
    const button = event.target.closest("[data-image]");
    if (!button) return;
    openModal(button.dataset.slug, button.dataset.image);
  });

  elements.closeModal.addEventListener("click", closeModal);
  elements.modalPrev.addEventListener("click", function () {
    changeModalImage(-1);
  });
  elements.modalNext.addEventListener("click", function () {
    changeModalImage(1);
  });

  elements.detailModal.addEventListener("click", function (event) {
    const closeTarget = event.target.closest("[data-close='true']");
    if (closeTarget) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (!elements.detailModal.hidden) {
      if (event.key === "Escape") {
        closeModal();
      } else if (event.key === "ArrowLeft") {
        changeModalImage(-1);
      } else if (event.key === "ArrowRight") {
        changeModalImage(1);
      }
    }
  });

  renderFilters();
  renderGrid();
})();
