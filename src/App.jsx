import { useCallback, useEffect, useRef, useState } from "react";
import { useNetworkStatus, useSync } from "./hooks";
import { v4 as uuidv4 } from "uuid";
import SavedNoteItem from "./NoteItem";

const defaultNote = {
    id: "",
    title: "",
    content: "",
    updatedAt: "",
    synced: false,
};

function App() {
    const [note, setNote] = useState({ ...defaultNote, id: uuidv4() });
    const [syncInProgress, setSyncInProgress] = useState(false);
    const debounceTimeout = useRef(null);
    const textAreaRef = useRef(null);
    const isOnline = useNetworkStatus();
    const {
        offlineData,
        saveOfflineUpdate,
        getOfflineUpdates,
        clearOnlySyncedNotes,
    } = useSync();

    const saveNote = async (note) => {
        setSyncInProgress(true);
        console.log(note);
        try {
            await fetch(
                "https://682693c1397e48c913168ec1.mockapi.io/api/v1/notes",
                {
                    method: "POST",
                    body: JSON.stringify(note),
                    headers: { "Content-Type": "application/json" },
                }
            );
            setSyncInProgress(false);
        } catch (error) {
            console.error("Error saving note to server:", error);
            setSyncInProgress(false);
            throw error;
        }
    };

    const handleSaveNote = async (key, value) => {
        if (!value.trim()) return;

        const updatedNote = {
            ...note,
            [key]: value,
            updatedAt: new Date().toISOString(),
            synced: true,
        };

        if (isOnline) {
            try {
                await saveNote(updatedNote);
                await saveOfflineUpdate([{ ...updatedNote, synced: true }]);
            } catch {
                await saveOfflineUpdate([updatedNote]);
            }
        } else {
            await saveOfflineUpdate([updatedNote]);
        }
    };

    const handleNewNote = useCallback(() => {
        setNote({ ...defaultNote, id: uuidv4() });
        if (textAreaRef.current) textAreaRef.current.value = "";
        if (textAreaRef.current) textAreaRef.current.focus();
    }, []);

    const handleEditNote = useCallback((note) => {
        setNote(note);
        if (textAreaRef.current) textAreaRef.current.autofocus = true;
    }, []);

    const handleDebouncedSaveNote = (e) => {
        const { id, value } = e.target;

        setNote((prev) => {
            const updatedNote = {
                ...prev,
                [id]: value,
                updatedAt: new Date().toISOString(),
                synced: false,
            };

            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            debounceTimeout.current = setTimeout(() => {
                saveOfflineUpdate([updatedNote]);
            }, 500);

            return updatedNote;
        });
    };

    useEffect(() => {
        if (isOnline) {
            (async () => {
                const offlineNotes = await getOfflineUpdates();
                const unsynced = offlineNotes.filter((n) => !n.synced);

                if (unsynced.length > 0) {
                    try {
                        await Promise.all(
                            unsynced.map(async (note) => {
                                const payload = {
                                    title: note.title,
                                    content: note.content,
                                    updatedAt: new Date().toISOString(),
                                    synced: true,
                                };

                                await saveNote(payload);
                            })
                        );

                        await clearOnlySyncedNotes();
                    } catch {
                        console.error("Sync failed, notes remain offline.");
                    }
                }
            })();
        }
    }, [isOnline]);

    useEffect(() => {
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
                <header className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        noted.
                    </h1>
                    <span
                        className={`text-xs px-3 py-1 rounded-full font-mono transition-colors duration-300 ${
                            isOnline
                                ? "bg-gradient-to-r from-green-400 to-blue-400 text-white"
                                : "bg-gradient-to-r from-red-400 to-pink-400 text-white"
                        }`}>
                        {isOnline ? "online" : "offline"}
                    </span>
                </header>
                <form
                    onSubmit={(e) => e.preventDefault()}
                    className="flex flex-col gap-6">
                    <div className="flex justify-between items-center mb-2">
                        <button
                            type="button"
                            onClick={handleNewNote}
                            className="text-xs px-4 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition font-medium shadow-sm">
                            + new
                        </button>
                        <span className="text-xs text-gray-400 tracking-widest uppercase">
                            {syncInProgress ? "syncing..." : ""}
                        </span>
                    </div>
                    <input
                        value={note.title}
                        placeholder="Title"
                        onChange={handleDebouncedSaveNote}
                        id="title"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none text-lg font-medium placeholder-gray-400 transition"
                    />
                    <textarea
                        value={note.content}
                        onChange={handleDebouncedSaveNote}
                        placeholder="Write your note..."
                        ref={textAreaRef}
                        id="content"
                        autoFocus
                        rows={5}
                        className="w-full bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none text-base placeholder-gray-400 resize-none transition"
                    />
                    <button
                        type="button"
                        onClick={async () => {
                            await handleSaveNote("content", note.content);
                        }}
                        className="w-full py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-500 transition">
                        Save
                    </button>
                </form>
            </div>
            <div className="w-full max-w-md mt-10">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
                    saved notes
                </h2>
                {!offlineData?.length ? (
                    <p className="text-gray-400 text-center py-8">
                        No notes yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {offlineData
                            .sort(
                                (a, b) =>
                                    new Date(b.updatedAt) -
                                    new Date(a.updatedAt)
                            )
                            .map((n) => (
                                <SavedNoteItem
                                    key={n.id}
                                    note={n}
                                    onClick={() => handleEditNote(n)}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
