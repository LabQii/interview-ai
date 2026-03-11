export const saveVideoDB = async (questionId: string, blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);

        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) {
                db.createObjectStore("videos");
            }
        };

        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readwrite");
            const store = tx.objectStore("videos");
            store.put(blob, questionId);

            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };

        idb.onerror = () => reject(idb.error);
    });
};

export const getVideoDB = async (questionId: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);

        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) {
                db.createObjectStore("videos");
            }
        };

        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readonly");
            const store = tx.objectStore("videos");
            const request = store.get(questionId);

            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        };

        idb.onerror = () => reject(idb.error);
    });
};

export const deleteVideoDB = async (questionId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const idb = indexedDB.open("InterviewDB", 1);

        idb.onupgradeneeded = () => {
            const db = idb.result;
            if (!db.objectStoreNames.contains("videos")) {
                db.createObjectStore("videos");
            }
        };

        idb.onsuccess = () => {
            const db = idb.result;
            const tx = db.transaction("videos", "readwrite");
            const store = tx.objectStore("videos");
            store.delete(questionId);

            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };

        idb.onerror = () => reject(idb.error);
    });
};
