"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import foldericon from "@/app/images/folder.png";
import pdficon from "@/app/images/pdf.png";
import styles from "./filecontent.module.css";

type ApiIdentity = {
    type: "user" | "application" | string;
    id?: string | null;
    displayName?: string | null;
    email?: string | null;
};

type ApiFileFacet = {
    mimeType?: string | null;
    hashes?: Record<string, string> | null;
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

    eTag?: string | null;
    cTag?: string | null;

    parentReference?: any;
    downloadUrl?: string | null;
};

type ApiResponse = {
    parentId: string;
    count: number;
    items: ApiFile[];
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

function isPdf(item: ApiFile) {
    const namePdf = item.name?.toLowerCase().endsWith(".pdf");
    const mimePdf = item.file?.mimeType === "application/pdf";

    return namePdf || mimePdf;
}


export function FileContent() {
    //state variables
    const [items, setItems] = useState<ApiFile[]>([]);
    const [parentId, setParentId] = useState<string>("root");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //load files/folders from API
    async function load(parent?: string) {
        setLoading(true);
        setError(null);
        try {
            //if parent is provided, load that folder; else load root
            const url = parent ? `/api/files?parentId=${encodeURIComponent(parent)}` : "/api/files";
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            const data: ApiResponse = await res.json();

            setItems(data.items || []);
            setParentId(data.parentId || (parent ? parent : "root"));
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // initial root load
        load();
    }, []);

    const fileCount = useMemo(
        () => items.filter((x) => x.type === "file").length,
        [items]
    );

    // folders first, then files, alphabetical
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
        });
    }, [items]);

    // open folder on click (load children)
    function openFolder(item: ApiFile) {
        if (item.type !== "folder") return;
        load(item.id);
    }

    return (
        <div className={styles.wrapper}>

            {/* TOP ROW */}
            <div className={`${styles.toprow} row apart`}>
                <span>
                    {parentId === "root" ? "All Folders" : "Folder Contents"}
                </span>
                <div>
                    <span>{fileCount} Files</span>
                </div>
            </div>

            {/* LOADING / ERROR */}
            {loading && <div>Loading…</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            {/* DATA LIST */}
            <div className={styles.dataCont}>
                {sortedItems.map((item) => {
                    // determine icon - add more types as needed
                    const icon = item.type === "folder" ? foldericon : pdficon;
                    const created = formatDate(item.createdDateTime);
                    const sizeOrCount =
                        item.type === "folder"
                        ? `${item.folder?.childCount ?? 0} items`
                        : formatBytes(item.size);

                    return (
                        <div
                        key={item.id}
                        className={`${styles.docBubble} row`}
                        onClick={() => openFolder(item)}
                        role={item.type === "folder" ? "button" : undefined}
                        style={item.type === "folder" ? { cursor: "pointer" } : undefined}
                        title={item.type === "folder" ? "Open folder" : item.name}
                        >
                            <Image
                                className={styles.docIcon}
                                src={item.type === "folder" ? foldericon : (isPdf(item) ? pdficon : pdficon)}
                                alt={item.type === "folder" ? "folder icon" : "file icon"}
                                width={item.type === "folder" ? 536 : 1201}
                                height={item.type === "folder" ? 388 : 872}
                                priority={false}
                            />

                            <div className={`${styles.docInfo} stack`}>
                                {/* doc name */}
                                <div className={styles.docName}>{item.name}</div>
                                {/* doc meta */}
                                <div className={`${styles.docMeta} row apart`}>
                                    <div id="docDate">{created}</div>
                                    <div id="docSize">{sizeOrCount}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!loading && !error && sortedItems.length === 0 && (
                    <div>No items found.</div>
                )}
            </div>
        </div>
    );
}
