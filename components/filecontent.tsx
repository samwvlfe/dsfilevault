"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import foldericon from "@/app/images/fileicons/folder.png";
import imageicon from "@/app/images/fileicons/image.png";
import pdficon from "@/app/images/fileicons/pdf.png";
import docxicon from "@/app/images/fileicons/docx.png";
import mp4icon from "@/app/images/fileicons/mp4.png";
import pptxicon from "@/app/images/fileicons/pptx.png";
import xlsxicon from "@/app/images/fileicons/xlsx.png";
import defaultfile from "@/app/images/fileicons/defaultfile.png";
import styles from "./filecontent.module.css";

type ApiIdentity = {
    type: "user" | "application" | string;
    id?: string | null;
    displayName?: string | null;
    email?: string | null;
};

type ApiFileFacet = {
    mimeType?: string | null;
};

type ApiFolderFacet = {
    childCount?: number | null;
};

type ApiFile = {
    id: string;
    name: string;
    webUrl?: string | null;
    size?: number | null;

    type: "folder" | "file" | "item";

    createdDateTime?: string | null;
    lastModifiedDateTime?: string | null;

    createdBy?: ApiIdentity | null;
    lastModifiedBy?: ApiIdentity | null;

    file?: ApiFileFacet | null;
    folder?: ApiFolderFacet | null;
};

type ApiResponse = {
    parentId: string;
    count: number;
    items: ApiFile[];
};

type Crumb = {
    id: string;
    label: string
};

type SearchResultItem = {
    id: string;
    name: string;
    type: "folder" | "file";
    webUrl?: string | null;
};

// ####### helper funcs for formatting data #######

function formatBytes(bytes?: number | null) {
    if (bytes == null) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = bytes / Math.pow(k, i);

    return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}


export function FileContent() {
    //state variables
    const [items, setItems] = useState<ApiFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [crumbs, setCrumbs] = useState<Crumb[]>([ { id: "root", label: "Home" } ]);
    const atRoot = crumbs.length <= 1;

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    //Debounce so Graph is not flooded with calls
    function useDebouncedValue<T>(value: T, delayMs: number) {
        const [debounced, setDebounced] = useState(value);
        useEffect(() => {
            const t = setTimeout(() => setDebounced(value), delayMs);
            return () => clearTimeout(t);
        }, [value, delayMs]);
        return debounced;
    }

    const debouncedSearchText = useDebouncedValue(searchText, 200);

    useEffect(() => {
        const url = buildSearchUrl(debouncedSearchText);

        // empty input => close dropdown + clear
        if (!url) {
            setSearchResults([]);
            setSearchOpen(false);
            setSearchLoading(false);
            setSearchError(null);
            return;
        }

        const ac = new AbortController();

        (async () => {
            try {
                setSearchLoading(true);
                setSearchError(null);
                setSearchOpen(true);

                const res = await fetch(url, { signal: ac.signal });
                if (!res.ok) throw new Error(`Search failed: ${res.status}`);

                // your search endpoint should return { items: [...] }
                const data = (await res.json()) as { items: SearchResultItem[] };

                setSearchResults(data.items ?? []);
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                setSearchError(e?.message ?? String(e));
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        })();

        return () => ac.abort();
    }, [debouncedSearchText]);


    //load files/folders from API
    async function load(parent?: string) {
        setLoading(true);
        setError(null);
        try {
            const url =
            parent && parent !== "root"
                ? `/api/files?parentId=${encodeURIComponent(parent)}`
                : "/api/files";

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const data: ApiResponse = await res.json();

            setItems(data.items || []);
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setCrumbs([{ id: "root", label: "Home" }]);
        load();
    }, []);

    // sort - get all folders 
    const folders = useMemo(() => {
        return items
            .filter((x) => x.type === "folder")
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [items]);

    // sort - get all files
    const files = useMemo(() => {
        return items
            .filter((x) => x.type === "file")
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [items]);


    function openFolder(item: ApiFile) {
        if (item.type !== "folder") return;

        setCrumbs((c) => [...c, { id: item.id, label: item.name}]);
        load(item.id);
    }

    // open foolder/load file on click
    function onItemClick(item: ApiFile) {
        //folder, render children
        if (item.type === "folder") {
            openFolder(item);
            return;
        }
        // file, open in new tab
        if (item.webUrl) {
            window.open(item.webUrl, "_blank", "noopener,noreferrer");
        }
    }


    function setIcon(name: string | undefined){
        const filetype = name?.split(".").pop()?.toLowerCase() || undefined;

        switch (filetype) {
            case "pdf":
                return pdficon;
            case "docx":
            case "dotx":
            case "doc":
                return docxicon;
            case "mp4":
            case "mov":
                return mp4icon;
            case "ppt":
            case "pptx":
                return pptxicon;
            case "xls":
            case "xlsx":
            case "csv":
                return xlsxicon;
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "bmp":
            case "svg":
                return imageicon;
            default:
                return defaultfile;
        }
    }

    // ############## Breadcrumb Logic ##############
    function jumpToCrumb(index: number) {
        setCrumbs((c) => {
            const next = c.slice(0, index + 1);
            const target = next[next.length - 1];

            load(target.id === "root" ? undefined : target.id);
            return next;
        });
    }

    function goBack() {
        if (crumbs.length <= 1) return;
        jumpToCrumb(crumbs.length - 2);
    }

    // ############## Search Logic ##############
    function buildSearchUrl(q: string) {
        const query = q.trim();

        if (!query) return null;

        return `/api/files?q=${query}`;
    }

    function onPickSearchResult(item: SearchResultItem) {
        setSearchOpen(false);

        if (item.type === "file") {
            if (item.webUrl) window.open(item.webUrl, "_blank", "noopener,noreferrer");
            return;
        }

        // folder
        setCrumbs([
            { id: "root", label: "Home" },
            { id: item.id, label: item.name },
        ]);

        load(item.id);
    }



    return (
        <div className={styles.wrapper}>
            {/* TOP ROW */}
            <div className={`${styles.toprow} stack`}>
                {/* UPPER */}
                <div className={styles.tr_lvl}>
                    {/* back button */}
                    <button
                        type="button"
                        className={`${styles.backButton} ${atRoot ? styles.backButtonHidden : styles.backButtonShown}`}
                        onClick={goBack}
                        disabled={atRoot || loading}
                        aria-disabled={atRoot || loading}
                        style={{ visibility: atRoot ? "hidden" : "visible" }}
                    >
                        <span>Back</span>
                    </button>

                    {/* search */}
                    <div className={styles.searchCont}>

                        <input
                            id="searchbar"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onFocus={() => searchText.trim() && setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                            placeholder="Search…"
                            className={styles.searchimp}
                        />

                        {/* {searchOpen && searchResults.length > 0 && ( */}

                            <div className={styles.resultsCont}>

                                {searchResults.slice(0, 12).map((r) => {
                                    const icon = r.type === "folder" ? foldericon : setIcon(r.name);

                                    return(
                                        <div className={styles.reswrap}>
                                            <button
                                                key={r.id}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => onPickSearchResult(r)}
                                                className={`${styles.result} row center`}
                                            >
                                                <Image
                                                    className={styles.resultimg}
                                                    src={icon}
                                                    alt={r.type === "folder" ? "Folder icon" : "File Icon"}
                                                    width={1201}
                                                    height={872}
                                                />
                                                <div className="resultname">{r.name}</div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        {/* )} */}
                    </div>
                </div> {/* /upper */}

                {/* LOWER */}
                <div className={styles.tr_lvl}>
                    {/* BREADCRUMBS */}
                    <nav aria-label="Breadcrumb">
                        <ol className={`${styles.crumblist} row center`}>
                            {crumbs.map((crumb, idx) => {
                                const isLast = idx == crumbs.length - 1;
                                return (
                                    <div className="row center">
                                        <li key={crumb.id}>
                                            <button
                                                type="button"
                                                className={`${styles.crumbBtn} ${isLast ? styles.crumbActive : styles.inact}`}
                                                onClick={() => jumpToCrumb(idx)}
                                                disabled={isLast || loading}
                                                aria-current={isLast ? "page" : undefined}
                                            >
                                                {crumb.label}
                                            </button>
                                        </li>
                                        <div className={`${styles.bcsep} ${isLast ? "hideele" : "showele"}`}> /</div>
                                    </div>
                                );
                            })}
                        </ol>
                    </nav>
                    <div className="hideMobile">
                        <span>
                            <span className={styles.folderTxt}>{folders.length} Folder{folders.length !== 1 ? "s" : ""}</span>, <span className={styles.fileTxt}>{files.length} File{files.length !== 1 ? "s" : ""}</span>
                        </span>
                    </div>
                </div> {/* /lower */}
            </div> {/* /toprow */}

            {/* LOADING / ERROR */}
            {loading && <div>Loading…</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            {/* DATA LIST */}
            {!loading && <div className={`${styles.dataCont} stack`}>
                {/* FOLDERS CONTAINER */}
                <div className={styles.folderGrid}>
                    {folders.length > 0 ? (
                        folders.map((item) => {
                            const sizeOrCount = `${item.folder?.childCount ?? 0} items`;

                            return (
                                <div
                                    key={item.id}
                                    className={`${styles.docBubble} row ${styles.folderBub}`}
                                    onClick={() => onItemClick(item)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") onItemClick(item);
                                    }}
                                    style={{ cursor: "pointer" }}
                                    title="Open folder"
                                >
                                    <Image
                                        className={styles.docIcon}
                                        src={foldericon}
                                        alt="folder icon"
                                        width={536}
                                        height={388}
                                    />

                                    <div className={`${styles.docInfo} row`}>
                                        <div className={styles.foldName}>{item.name}</div>
                                        <div className={styles.foldMeta}>{sizeOrCount}</div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                    !loading && !error && <div className={styles.emptySection}></div>
                    )}
                </div>
                
                {/* FILES CONTAINER */}
                <div className={styles.fileGrid}>
                    {files.length > 0 ? (
                        files.map((item) => {
                            let icon = setIcon(item.name);

                            const created = formatDate(item.createdDateTime);
                            const sizeOrCount = formatBytes(item.size);

                            return (
                            <div
                                key={item.id}
                                className={`${styles.docBubble} row ${styles.fileBub}`}
                                onClick={() => onItemClick(item)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") onItemClick(item);
                                }}
                                style={{ cursor: "pointer" }}
                                title={item.name}
                            >
                                <Image
                                    className={styles.docIcon}
                                    src={icon}
                                    alt="file icon"
                                    width={1201}
                                    height={872}
                                />

                                <div className={`${styles.docInfo} stack`}>
                                    <div className={styles.docName}>{item.name}</div>
                                    <div className={`${styles.docMeta} row`}>
                                        <div>{created}</div>
                                        <span> - </span>
                                        <div>{sizeOrCount}</div>
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                    !loading && !error && <div className={styles.emptySection}></div>
                    )}
                </div>

                {/* IF COMPLETELY EMPTY */}
                {!loading && !error && folders.length === 0 && files.length === 0 && (
                    <div>No items found.</div>
                )}
            </div>}

        </div>
    );
}
