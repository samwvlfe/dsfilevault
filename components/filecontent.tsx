"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./filecontent.module.css";

type ApiFile = {
    id?: string;
    name: string;
    WebUrl?: string;
    size?: number;
};

export function FileContent() {
    const [files, setFiles] = useState<ApiFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let cancelled = false;

        // Fetch files from your API endpoint
        async function load() {
            try {
                setLoading(true);
                setError("");
                const res = await fetch("/api/files", { cache: "no-store" });
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();

                const list: ApiFile[] = data.files ?? [];
                setFiles(list);

                if (!cancelled) setFiles(list);
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load files");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    //alternate colors for rows and populate links
    const rows = useMemo(() => {
        return files.map((f, i) => {
            const href = f.WebUrl ?? "#";
            const grey = i % 2 === 1;

            return (
                <div key={f.id ?? `${f.name}-${i}`} className={`${styles.c_row} ${grey ? styles.grey : ""}`}>

                    <a href={href} target="_blank" rel="noreferrer">
                        {f.name}
                    </a>
                    
                </div>
            );
        });
    }, [files]);

    return (
        <div className={styles.wrapper}>
        {/* NAV */}
        <div className={`${styles.nav} stack`}>
            <div className={styles.title}>Hot Links/Search/Directory</div>
        </div>

        {/* FILE LIST(s) */}
        <div className={`${styles.column} stack`}>
            <div className={styles.c_hdr}>Documents</div>

            {loading && <div className={styles.c_row}>Loading…</div>}
            {error && <div className={styles.c_row}>Error: {error}</div>}

            {!loading && !error && files.length === 0 && (
            <div className={styles.c_row}>No files found.</div>
            )}

            {!loading && !error && rows}
        </div>
        </div>
    );
}