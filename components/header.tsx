"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./header.module.css";
import dockstarlogo from "@/app/logo.png";
import { terminal } from "@/app/fonts";

type ClientPrincipal = {
    userId: string;
    userDetails: string;
    userRoles: string[];
    claims?: { typ: string; val: string }[];
};

type AuthMeResponse =
    | { clientPrincipal?: ClientPrincipal }
    | { clientPrincipal?: ClientPrincipal }[]; // just in case

export function Header() {
    const [principal, setPrincipal] = useState<ClientPrincipal | null>(null);

    useEffect(() => {
        fetch("/.auth/me")
        .then((r) => r.json())
        .then((data: AuthMeResponse) => {
            // handle either {clientPrincipal} or [{clientPrincipal}]
            const cp = Array.isArray(data) ? data[0]?.clientPrincipal : data?.clientPrincipal;
            setPrincipal(cp ?? null);

            // TEMP: inspect what claims you actually get
            console.log("/.auth/me", data);
        })
        .catch(() => setPrincipal(null));
    }, []);

    const claims = principal?.claims ?? [];
    const name =
        claims.find((c) => c.typ === "name")?.val ||
        claims.find((c) => c.typ === "preferred_username")?.val ||
        principal?.userDetails ||
        "";

    return (
        <div className={`${styles.hdr} ${terminal.className} row apart`}>
            <Image
                className={styles.logo}
                src={dockstarlogo}
                alt="dockstar logo"
                width={1420}
                height={427}
                priority
            />
            <div className={styles.title}>FILE VAULT</div>
            <div className={styles.user}>{name ? `Welcome, ${name}!` : "Welcome!"}</div>
        </div>
    );
}
