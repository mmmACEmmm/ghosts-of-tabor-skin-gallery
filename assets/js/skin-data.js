function safeString(value) {
  return String(value ?? "");
}

export function encodeAssetPath(path) {
  const rawValue = safeString(path);

  if (!rawValue) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(rawValue) || rawValue.startsWith("/")) {
    return rawValue;
  }

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

export function escapeHtml(value) {
  return safeString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getSourceGroup(entry) {
  const sourceType = safeString(entry.sourceType).trim();
  const sourceValue = safeString(entry.sourceValue).trim();

  if (/^dlc$/i.test(sourceType)) {
    return "DLC";
  }

  return sourceValue || sourceType || "Unknown";
}

function normalizeSkin(entry) {
  const galleryImages = Array.isArray(entry.galleryImages) ? entry.galleryImages.filter(Boolean) : [];
  const usableGallery = galleryImages.filter((path) => !/placeholder/i.test(path));
  const detailImages = unique([entry.coverImage, ...usableGallery]);
  const displayImage = entry.coverImage || usableGallery[0] || "";
  const sourceGroup = getSourceGroup(entry);
  const compatibleItems = Array.isArray(entry.compatibleItems) ? entry.compatibleItems : [];
  const searchableText = [
    entry.name,
    entry.sourceLabel,
    entry.sourceType,
    entry.sourceValue,
    ...compatibleItems,
  ]
    .join(" ")
    .toLowerCase();

  return {
    ...entry,
    compatibleItems,
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

export async function loadStaticSkinData() {
  const response = await fetch("/data/skins.json", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load local skin metadata.");
  }

  return response.json();
}

export function mergeGallerySkins(rawSkins, approvedRows, options = {}) {
  const groupedApproved = new Map();
  const useLocalFallback = Boolean(options.useLocalFallback);

  if (Array.isArray(approvedRows)) {
    approvedRows.forEach((row) => {
      const slug = safeString(row.skin_slug || row.slug).trim();
      if (!slug) {
        return;
      }

      const group = groupedApproved.get(slug) || [];
      group.push(row.public_url || `/api/previews?submissionId=${encodeURIComponent(row.id)}`);
      groupedApproved.set(slug, group);
    });
  }

  return rawSkins.map((entry) => {
    const fallbackGallery = useLocalFallback
      ? Array.isArray(entry.galleryImages)
        ? entry.galleryImages
        : []
      : [];

    const galleryImages = Array.isArray(approvedRows)
      ? groupedApproved.get(entry.slug) || []
      : fallbackGallery;

    return normalizeSkin({
      ...entry,
      galleryImages,
      hasGallery: galleryImages.length > 0,
      hasPlaceholderPreview: useLocalFallback ? Boolean(entry.hasPlaceholderPreview) : false,
    });
  });
}
