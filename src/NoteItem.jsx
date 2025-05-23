import { memo } from "react";
import moment from "moment";
import { useNetworkStatus, useSync } from "./hooks";

const SavedNoteItem = ({ note, onClick }) => {
    const isOnline = useNetworkStatus();
    const { deleteNote } = useSync();

    const deleteNoteEverywhere = async (id) => {
        // Step 1: Delete from IndexedDB
        await deleteNote(id);

        // Step 2: Delete from MockAPI if online
        if (isOnline) {
            try {
                await fetch(
                    `https://682693c1397e48c913168ec1.mockapi.io/api/v1/notes/${id}`,
                    {
                        method: "DELETE",
                    }
                );
            } catch (error) {
                console.error(
                    `Failed to delete note ${id} from MockAPI`,
                    error
                );
            }
        } else {
            console.log(
                "Offline — only deleted locally. Will remain deleted in next sync."
            );
        }
    };

    return (
        <div
            className="flex items-center justify-between  rounded-sm shadow-md p-4 mb-3 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={onClick}>
            <div>
                <h5 className="text-lg font-semibold text-black truncate">
                    {note.title || note.content}
                </h5>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <span>{new Date(note.updatedAt).toDateString()}</span>
                    <span className="text-cyan-400">
                        {moment(note.updatedAt).fromNow()}
                    </span>
                </p>
            </div>
            <button
                className="ml-4 p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-500 focus:outline-none"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteNoteEverywhere(note.id);
                }}
                aria-label="Delete note">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
};

export default memo(SavedNoteItem);
