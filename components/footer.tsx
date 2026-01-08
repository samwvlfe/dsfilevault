import styles from "./footer.module.css";

export function Footer() {
    return (
        <div className={`${styles.ftr} row center`}>
            <div>© {new Date().getFullYear()} DockStar Industrial All rights reserved.</div>
        </div>
    );
}