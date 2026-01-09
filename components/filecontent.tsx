"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import foldericon from "@/app/images/folder.png";
import pdficon from "@/app/images/pdf.png";
import styles from "./filecontent.module.css";

type ApiFile = {
    id?: string;
    name: string;
    webUrl?: string;
    size?: number;
};

export function FileContent() {


    return (
        <div className={styles.wrapper}>

            <div className={`${styles.toprow} row apart`}>
                <span>All Folders</span>
                <div>2112<span> Files</span></div>
            </div>

            <div className={styles.dataCont}>

                <div className={`${styles.docBubble} row`}>
                    <Image
                        className={styles.docIcon}
                        src={foldericon}
                        alt="folder icon"
                        width={536}
                        height={388}
                        priority
                    />
                    <div className={`${styles.docInfo} stack`}>
                        <div className={styles.docName}>Foldername</div>
                        <div className={`${styles.docMeta} row apart`}>
                            <div id="docDate">Date Create</div>
                            <div id="docSize">Size</div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.docBubble} row`}>
                    <Image
                        className={styles.docIcon}
                        src={foldericon}
                        alt="folder icon"
                        width={536}
                        height={388}
                        priority
                    />
                    <div className={`${styles.docInfo} stack`}>
                        <div className={styles.docName}>Foldername</div>
                        <div className={`${styles.docMeta} row apart`}>
                            <div id="docDate">Date Create</div>
                            <div id="docSize">Size</div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.docBubble} row`}>
                    <Image
                        className={styles.docIcon}
                        src={pdficon}
                        alt="folder icon"
                        width={1201}
                        height={872}
                        priority
                    />
                    <div className={`${styles.docInfo} stack`}>
                        <div className={styles.docName}>Filename</div>
                        <div className={`${styles.docMeta} row apart`}>
                            <div id="docDate">Date Create</div>
                            <div id="docSize">Size</div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.docBubble} row`}>
                    <Image
                        className={styles.docIcon}
                        src={pdficon}
                        alt="folder icon"
                        width={1201}
                        height={872}
                        priority
                    />
                    <div className={`${styles.docInfo} stack`}>
                        <div className={styles.docName}>Filename</div>
                        <div className={`${styles.docMeta} row apart`}>
                            <div id="docDate">Date Create</div>
                            <div id="docSize">Size</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}