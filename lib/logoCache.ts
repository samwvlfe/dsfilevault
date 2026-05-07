import { useEffect, useRef, useState } from "react";

type ApiThumbnailSize = {
    url: string;
    width?: number;
    height?: number;
};

type ApiThumbnailSet = {
    id?: string;
    small?: ApiThumbnailSize;
    medium?: ApiThumbnailSize;
    large?: ApiThumbnailSize;
};

type ApiItem = {
    id: string;
    name: string;
    thumbnails?: ApiThumbnailSet[] | null;
};

type ApiResponse = {
    parentId: string;
    count: number;
    items: ApiItem[];
};

type FolderLike = {
    id: string;
    name: string;
    type: string;
};

const STORAGE_KEY = "dsfilevault_logo_cache";
export const LOGO_PATTERN = /logo\.(png|jpe?g|avif|webp|svg)$/i;

// ── Module-level in-memory cache (survives component remounts) ──
const memoryCache: Record<string, string> = {};

// ── SessionStorage helpers (survives navigations within the tab) ──
function loadStorageCache(): Record<string, string> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveToStorage(id: string, url: string) {
    try {
        const existing = loadStorageCache();
        existing[id] = url;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
        // quota exceeded or unavailable — ignore
    }
}

// Hydrate memory cache from sessionStorage on first load
function hydrateMemoryCache() {
    const stored = loadStorageCache();
    for (const [id, url] of Object.entries(stored)) {
        if (!memoryCache[id]) {
            memoryCache[id] = url;
        }
    }
}
hydrateMemoryCache();

// ── Core fetch function ──
async function fetchLogoForFolder(
    folderId: string,
    signal?: AbortSignal
): Promise<string | null> {
    const res = await fetch(
        `/api/files?parentId=${encodeURIComponent(folderId)}`,
        { signal }
    );
    if (!res.ok) return null;

    const data: ApiResponse = await res.json();
    const logoFile = data.items.find((item) => LOGO_PATTERN.test(item.name));
    if (!logoFile) return null;

    return (
        logoFile.thumbnails?.[0]?.large?.url ??
        logoFile.thumbnails?.[0]?.medium?.url ??
        logoFile.thumbnails?.[0]?.small?.url ??
        null
    );
}

// ── Prefetch all logos for a list of folders ──
export async function prefetchLogos(
    folders: FolderLike[],
    signal?: AbortSignal
): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const toFetch: FolderLike[] = [];

    for (const folder of folders) {
        if (memoryCache[folder.id]) {
            results[folder.id] = memoryCache[folder.id];
        } else {
            toFetch.push(folder);
        }
    }

    if (toFetch.length === 0) return results;

    await Promise.allSettled(
        toFetch.map(async (folder) => {
            const url = await fetchLogoForFolder(folder.id, signal);
            if (url && !signal?.aborted) {
                memoryCache[folder.id] = url;
                saveToStorage(folder.id, url);
                results[folder.id] = url;
            }
        })
    );

    return results;
}

// ── React hook: drop-in replacement for the inline useEffect ──
export function useFolderLogos(folders: FolderLike[]) {
    const [logos, setLogos] = useState<Record<string, string>>({});
    const prevFolderIds = useRef<string>("");

    useEffect(() => {
        const folderItems = folders.filter((x) => x.type === "folder");
        const idKey = folderItems.map((f) => f.id).join(",");

        // skip if same set of folders
        if (idKey === prevFolderIds.current) return;
        prevFolderIds.current = idKey;

        if (folderItems.length === 0) {
            setLogos({});
            return;
        }

        // apply anything already cached instantly
        const cached: Record<string, string> = {};
        const uncached: FolderLike[] = [];

        for (const folder of folderItems) {
            if (memoryCache[folder.id]) {
                cached[folder.id] = memoryCache[folder.id];
            } else {
                uncached.push(folder);
            }
        }

        if (Object.keys(cached).length > 0) {
            setLogos(cached);
        }

        if (uncached.length === 0) return;

        const controller = new AbortController();

        // fire all fetches in parallel, update state progressively
        for (const folder of uncached) {
            (async () => {
                try {
                    const url = await fetchLogoForFolder(
                        folder.id,
                        controller.signal
                    );
                    if (url && !controller.signal.aborted) {
                        memoryCache[folder.id] = url;
                        saveToStorage(folder.id, url);
                        setLogos((prev) => ({ ...prev, [folder.id]: url }));
                    }
                } catch {
                    // ignore aborts and individual failures
                }
            })();
        }

        return () => controller.abort();
    }, [folders]);

    return logos;
}
