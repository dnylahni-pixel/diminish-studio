import { create } from "zustand";

export type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export interface UploadState {
  status: UploadStatus;
  fileName: string | null;
  fileSize: number | null;
  progress: number; // 0-100
  errorMessage: string | null;
  completedSongId: number | null;

  // Actions
  startUpload: (fileName: string, fileSize: number) => void;
  setProgress: (progress: number) => void;
  setProcessing: () => void;
  completeUpload: (songId: number) => void;
  failUpload: (error: string) => void;
  dismissCompleted: () => void;
  dismissError: () => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as UploadStatus,
  fileName: null,
  fileSize: null,
  progress: 0,
  errorMessage: null,
  completedSongId: null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,

  startUpload: (fileName, fileSize) =>
    set({
      status: "uploading",
      fileName,
      fileSize,
      progress: 0,
      errorMessage: null,
      completedSongId: null,
    }),

  setProgress: (progress) =>
    set({
      progress,
      status: "uploading",
    }),

  setProcessing: () =>
    set({
      status: "processing",
    }),

  completeUpload: (songId) =>
    set({
      status: "completed",
      progress: 100,
      completedSongId: songId,
      errorMessage: null,
    }),

  failUpload: (error) =>
    set({
      status: "error",
      errorMessage: error,
    }),

  dismissCompleted: () =>
    set({
      status: "idle",
      fileName: null,
      fileSize: null,
      progress: 0,
      errorMessage: null,
      completedSongId: null,
    }),

  dismissError: () =>
    set({
      status: "idle",
      fileName: null,
      fileSize: null,
      progress: 0,
      errorMessage: null,
      completedSongId: null,
    }),

  reset: () => set(initialState),
}));