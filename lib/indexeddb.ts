export const saveVideoDB = async (key: string, blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);
        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
        };
        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readwrite");
            tx.objectStore("videos").put(blob, key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
        };
        idb.onerror = () => reject(idb.error);
    });
};

export const getVideoDB = async (key: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);
        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
        };
        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readonly");
            const req = tx.objectStore("videos").get(key);
            req.onsuccess = () => { db.close(); resolve(req.result || null); };
            req.onerror = () => reject(req.error);
        };
        idb.onerror = () => reject(idb.error);
    });
};

export const deleteVideoDB = async (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);
        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
        };
        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readwrite");
            tx.objectStore("videos").delete(key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
        };
        idb.onerror = () => reject(idb.error);
    });
};

