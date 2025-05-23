import { useEffect, useState } from "react";
import { openDB } from "idb";

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
};

const version = 3;

export const useSync = () => {
    const [offlineData, setOfflineData] = useState([]);

    const openDatabase = async () => {
        return openDB("Demo-SyncDB", version, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("updates")) {
                    db.createObjectStore("updates", { keyPath: "id" });
                }
            },
        });
    };

    const saveOfflineUpdate = async (updates) => {
        const db = await openDatabase();
        const tx = db.transaction("updates", "readwrite");
        const store = tx.objectStore("updates");
        for (const update of updates) {
            await store.put(update);
        }
        await tx.done;
        const allUpdates = await db.getAll("updates");
        setOfflineData(allUpdates);
        db.close();
    };

    const getOfflineUpdates = async () => {
        const db = await openDatabase();
        const data = await db.getAll("updates");
        setOfflineData(data);
        db.close();
        return data;
    };

    const syncToServer = async (syncFunction) => {
        const updates = await getOfflineUpdates();
        if (updates.length === 0) return;
        try {
            await syncFunction(updates);
            await clearOnlySyncedNotes();
            console.log("Sync successful!");
        } catch (error) {
            console.error("Sync failed, will retry later", error);
        }
    };

    const deleteNote = async (id) => {
        const db = await openDatabase();
        const tx = db.transaction("updates", "readwrite");
        const store = tx.objectStore("updates");
        await store.delete(id);
        await tx.done;
        const allUpdates = await db.getAll("updates");
        setOfflineData(allUpdates);
        db.close();
    };

    const clearOnlySyncedNotes = async () => {
        const db = await openDatabase();
        const tx = db.transaction("updates", "readwrite");
        const store = tx.objectStore("updates");
        const allNotes = await store.getAll();

        // Keep only unsynced notes
        for (const note of allNotes) {
            if (note.synced) {
                await store.delete(note.id);
            }
        }

        const remaining = await store.getAll();
        setOfflineData(remaining);
        db.close();
    };

    return {
        saveOfflineUpdate,
        getOfflineUpdates,

        clearOnlySyncedNotes,
        deleteNote,
        syncToServer,
        offlineData,
    };
};
