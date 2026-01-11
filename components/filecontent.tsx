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
import { Space_Mono } from "next/font/google";

type ApiIdentity = {
    type: "user" | "application" | string;
    id?: string | null;
    displayName?: string | null;
    email?: string | null;
};

type ApiFileFacet = { mimeType?: string | null; };

type ApiFolderFacet = { childCount?: number | null; };

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
    const [currentLabel, setCurrentLabel] = useState<string>("HOME");
    const [nameHistory, setNameHistory] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);

    const atRoot = history.length === 0;
    

    //load files/folders from API
    async function load(parent?: string, opts?: { pushHistory: boolean }) {
        setLoading(true);
        setError(null);
        try {
            // push selected parent BEFORE navigating into a folder
            if (opts?.pushHistory && parentId) {
                setHistory((h) => [...h, parentId]);
            }

            //if parent is provided, load that folder; else load root
            const url = parent && parent !== "root" ? `/api/files?parentId=${encodeURIComponent(parent)}` : "/api/files";
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
        setCurrentLabel("All Folders");
        setNameHistory([]);
        // initial root load
        load();
    }, []);

    const fileCount = useMemo(
        () => items.filter((x) => x.type === "file").length,
        [items]
    );

    const folderCount = useMemo(
        () => items.filter((x) => x.type === "folder").length,
        [items]
    );

    function openFolder(item: ApiFile) {
        if (item.type !== "folder") return;

        setNameHistory((h) => [...h, currentLabel]);
        setCurrentLabel(item.name);
        load(item.id, { pushHistory: true });
    }

    // folders first, then files, alphabetical
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
        });
    }, [items]);

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

    // navigate back to previous folder
    function goBack() {
        setHistory((h) => {
            if (h.length === 0) return h;

            const prev = h[h.length - 1];
            const nextHistory = h.slice(0, -1);

            // restore label in sync
            setNameHistory((nh) => {
                const prevLabel = nh[nh.length - 1] ?? "All Folders";
                setCurrentLabel(prevLabel);
                return nh.slice(0, -1);
            });

            // load previous parent WITHOUT pushing history
            load(prev === "root" ? undefined : prev, { pushHistory: false });
            return nextHistory;
        });
    }

    return (
        <div className={styles.wrapper}>

            {/* TOP ROW */}
            <div className={`${styles.toprow} row center`}>
                <button
                    className={`${styles.backButton} ${atRoot ? styles.backButtonHidden : styles.backButtonShown}`}
                    onClick={goBack}
                    disabled={atRoot || loading}
                    aria-disabled={atRoot || loading}
                    style={{ visibility: atRoot ? "hidden" : "visible" }}
                >
                    <span>Back</span>
                </button>
                <div className={`${styles.labels} row center`}>
                    <span style={{ fontSize: 20 }}>
                        <strong>{currentLabel}</strong>
                    </span>
                    <div>
                        <span>
                            <span className={styles.folderTxt}>{folderCount} Folder{folderCount !== 1 ? "s" : ""}</span>, <span className={styles.fileTxt}>{fileCount} File{fileCount !== 1 ? "s" : ""}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* LOADING / ERROR */}
            {loading && <div>Loading…</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            {/* DATA LIST */}
            <div className={styles.dataCont}>
                {sortedItems.map((item) => {
                    const isFolder = item.type === "folder";
                    // determine icon - add more types as needed
                    let icon;
                    if(isFolder){
                        icon = foldericon;
                    }
                    else{
                        const fileType = item.name.split('.').pop()?.toLowerCase();
                        switch(fileType){
                            case "pdf":
                                icon = pdficon;
                                break;
                            case "docx":
                            case "dotx":
                            case "doc":
                                icon = docxicon;
                                break;
                            case "mp4":
                            case "mov":
                                icon = mp4icon;
                                break;
                            case "ppt":
                            case "pptx":
                                icon = pptxicon;
                                break;
                            case "xls":
                            case "xlsx":
                            case "csv":
                                icon = xlsxicon;
                                break;
                            case "jpg":
                            case "jpeg":
                            case "png":
                            case "gif":
                            case "bmp":
                            case "svg":
                                icon = imageicon;
                                break;
                            default:
                                icon = defaultfile;
                        }
                    }

                    const created = formatDate(item.createdDateTime);
                    const sizeOrCount =
                        isFolder
                        ? `${item.folder?.childCount ?? 0} items`
                        : formatBytes(item.size);

                    return (
                        <div
                          key={item.id}
                          className={`${styles.docBubble} row ${isFolder ? styles.folderBub : styles.fileBub}`}
                          onClick={() => onItemClick(item)}
                          role= "button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") onItemClick(item);
                          }}
                          style={{ cursor: "pointer"}}
                          title={isFolder ? "Open folder" : item.name}
                        >
                            <Image
                              className={styles.docIcon}
                              //decide what icon to show
                              src={icon}
                              alt={isFolder ? "folder icon" : "file icon"}
                              width={isFolder ? 536 : 1201}
                              height={isFolder ? 388 : 872}
                              priority={false}
                            />

                            <div className={`${styles.docInfo} stack`}>
                                {/* doc name */}
                                <div className={styles.docName}>{item.name}</div>
                                {/* doc meta */}
                                <div className={`${styles.docMeta} row apart`}>
                                    <div>{created}</div>
                                    <div>{sizeOrCount}</div>
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
