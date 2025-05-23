# Notes App

An offline-capable React notes app that allows users to create, edit, and sync notes seamlessly when back online.

## Features

- Create and edit notes with a title and content

- Works both online and offline

- Automatically syncs offline notes when reconnected to the MockApi

- Saves notes locally if network is unavailable

- Debouncing to optimize saving performance

- Perform CRUD operations

## Installation

```bash
# Clone the repository
git clone https://github.com/ansh9918/TruPulse-assignment.git
cd notes-app-demo

# Install dependencies
npm install

# Start the development server
npm run dev
```

## How It Works

### State Management

The app uses useState to track:

- note: Currently edited note

- syncInProgress: Sync status

### Network Status Tracking

A custom hook useNetworkStatus() detects if the user is online or offline.

### Offline Data Handling

useSync() manages local storage, allowing users to:

- Save notes offline

- Retrieve unsynced notes

- Clear notes after syncing

### Auto-Saving Notes

- If online, notes save directly to the MockApi server.

- If offline, notes are stored locally and sync when back online.

### Debouncing Input

A 500ms delay prevents excessive API calls while typing.

### Syncing Offline Notes

When the user reconnects:

- Unsynced notes are sent to the server.

- Synced notes are removed from local storage.

## Usage

- Start the app using npm run dev.

- Write notes, even without an internet connection.

- Notes will sync automatically when you go back online.

