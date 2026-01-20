"use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
import styles from "./mainshell.module.css";
import { FileContent } from "@/components/filecontent";

export function MainShell() {
    return (
        <div className={styles.wrapper}>
            {/* <div className={`${styles.infobar} row center`}>
                <div className={styles.txt}>
                    All Files Accessable by DockStar employees on OneDrive - here in one place.
                </div>
            </div> */}
            <FileContent />
        </div>
    );
}
