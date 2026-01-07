"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./header.module.css"
import dockstarlogo from "@/app/logo.png";
import { roboto } from "@/app/fonts";

type AuthMe = {
  clientPrincipal?: {
    userID: string;
    userDetails: string;
    userRoles: string[];
    claims: { typ: string; val: string }[];
  }
}

export function Header() {
    const [me, setMe] = useState<AuthMe | null>(null);

    useEffect(() => {
        fetch("/.auth/me")
        .then(r => r.json())
        .then(setMe)
        .catch(() => setMe(null));
    }, []);

    // const email = me?.clientPrincipal?.userDetails ?? me?.clientPrincipal?.claims?.find(c => c.typ === "preferred_username")?.val ?? "";

    const name = me?.clientPrincipal?.claims?.find(c => c.typ === "name")?.val ?? "";

    return (
        <div className={`${styles.hdr} row`}>
            <Image
                className={styles.logo}
                src={dockstarlogo}
                alt="dockstar xmas logo"
                width={1420}
                height={427}
                priority
            />
            <div className={`${roboto.className} ${styles.title}`}>
                FILE VAULT
            </div>
            <div className={styles.user}>
                Welcome, {name}!
            </div>
        </div>
    );
}