import styles from "./filecontent.module.css";

export function FileContent() {
    return (
        <div className={styles.wrapper}>
            
            {/* NAV */}
            <div className={`${styles.nav} stack`}>
                <div className={styles.title}>Hot Links/Search/Directory</div>
            </div>

            {/* FILE LIST(s) */}
            <div className={`${styles.column} stack`}>
                <div className={styles.c_hdr}>Documents</div>
                <div className={styles.c_row}><a href="">File1</a></div>
                <div className={`${styles.c_row} ${styles.grey}`}><a href="">File2</a></div>
                <div className={styles.c_row}><a href="">File3</a></div>
                
            </div>
        </div>
    );
}