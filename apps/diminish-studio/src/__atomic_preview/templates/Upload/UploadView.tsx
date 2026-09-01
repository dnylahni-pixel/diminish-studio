/**
 * TEMPLATE: UploadView — atomic preview real upload (not mock)
 * Replicates apps/diminish-studio/src/pages/process.tsx (669 lines) in atomic style:
 * - tokens (colors[theme]) + useTheme bridge, NOT old index.css vars
 * - Real API: presignUpload -> XHR PUT (capped 95%) -> confirmUpload, cancelUpload, runtimeConfig validation
 * - Validation: extension, size, duration via Audio element, disabled URL import
 * - UI: atomic Sidebar tokens, motion.easing.lux, rounded 12, dashed dropzone, token progress bar
 */
import { useState, useEffect, useRef } from "react";
import { Upload as UploadIcon, Link as LinkIcon, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  cancelUpload,
  confirmUpload,
  presignUpload,
  type AudioMimeType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useRuntimeConfig } from "@/lib/runtime-config";
import { useTheme } from "@/hooks/use-theme";
import { colors, motion as motionTokens, typography, type Theme, type ThemeTokens } from "../../tokens";
import { useUploadStore } from "../../stores/uploadStore";

const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/ogg": "ogg",
  "audio/vorbis": "ogg",
  "application/ogg": "ogg",
};

const DEFAULT_EXTENSIONS = [".mp3", ".wav", ".flac", ".m4a", ".ogg"] as const;

function mimeTypesToExtensions(mimeTypes: string[]): string[] {
  const extensions = new Set<string>();
  for (const mime of mimeTypes) {
    const ext = MIME_TO_EXT[mime];
    if (ext) extensions.add(`.${ext}`);
  }
  const list = Array.from(extensions);
  return list.length > 0 ? list : [...DEFAULT_EXTENSIONS];
}

type Props = {
  theme?: Theme;
  tokens?: ThemeTokens;
};

export function UploadView(props: Props) {
  const { isDark } = useTheme();
  const derivedTheme: Theme = isDark ? "dark" : "light";
  const theme = props.theme ?? derivedTheme;
  const tokens = props.tokens ?? colors[theme];

  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadTokenRef = useRef<string | null>(null);
  const mimeTypeRef = useRef<string>("audio/mpeg");
  const { toast } = useToast();

  const uploadStore = useUploadStore();

  // runtime limits (from GET /config/bootstrap; fallback to previous hardcoded)
  const runtimeConfig = useRuntimeConfig();
  const ALLOWED_EXTENSIONS = mimeTypesToExtensions(runtimeConfig.upload.allowedMimeTypes);
  const MAX_FILE_SIZE = runtimeConfig.upload.maxFileSizeBytes;
  const MAX_DURATION = runtimeConfig.upload.maxDurationS;
  const urlImportEnabled = runtimeConfig.ui.urlImportEnabled;
  const extensionLabels = ALLOWED_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(", ");
  const maxFileSizeLabel = `${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`;
  const maxDurationLabel =
    MAX_DURATION >= 60 ? `${Math.round(MAX_DURATION / 60)} minutes` : `${MAX_DURATION} seconds`;
  const acceptAttr = [...ALLOWED_EXTENSIONS, ...runtimeConfig.upload.allowedMimeTypes].join(",");

  const isUploading = uploadStore.status === "uploading" || uploadStore.status === "processing";
  const uploadProgress = uploadStore.progress;
  const uploadedSongId = uploadStore.status === "completed" ? uploadStore.completedSongId : null;
  const uploadStoreFileName = uploadStore.fileName;

  const validateFileExtension = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext.toLowerCase()));
  };

  const validateFileSize = (file: File): boolean => file.size <= MAX_FILE_SIZE;

  const validateAudioDuration = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration <= MAX_DURATION);
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      });
      audio.src = objectUrl;
    });
  };

  const handleFileValidation = async (file: File) => {
    if (!validateFileExtension(file)) {
      toast({
        title: "Invalid file format",
        description: `Please upload ${extensionLabels} files only.`,
        variant: "destructive",
      });
      return false;
    }
    if (!validateFileSize(file)) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxFileSizeLabel}. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return false;
    }
    const isDurationValid = await validateAudioDuration(file);
    if (!isDurationValid) {
      toast({
        title: "Audio too long",
        description: `Maximum duration is ${maxDurationLabel}.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const uploadFileToPresignedUrl = async (file: File, presignedUrl: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const rawPercent = (e.loaded / e.total) * 100;
          const capped = Math.min(95, Math.round(rawPercent));
          uploadStore.setProgress(capped);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          uploadStore.setProgress(100);
          resolve(true);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
      xhr.send(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    const isValid = await handleFileValidation(file);
    if (!isValid) return;

    if (uploadStore.status === "completed" || uploadStore.status === "error") {
      uploadStore.reset();
    }

    setSelectedFile(file);

    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(Math.ceil(audio.duration));
    });
    audio.src = objectUrl;
    setAudioPreviewUrl(objectUrl);

    toast({
      title: "File ready",
      description: `${file.name} is ready to upload.`,
    });
  };

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPreviewUrl]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const mimeType = selectedFile.type || "audio/mpeg";
    mimeTypeRef.current = mimeType;

    uploadStore.startUpload(selectedFile.name, selectedFile.size);

    try {
      const { uploadUrl, uploadToken: token } = await presignUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: mimeType as AudioMimeType,
        duration: audioDuration,
      });

      uploadTokenRef.current = token;

      toast({
        title: "Uploading...",
        description: "Uploading your file to storage.",
      });

      const uploadSuccess = await uploadFileToPresignedUrl(selectedFile, uploadUrl);

      if (!uploadSuccess) throw new Error("Upload failed");

      uploadStore.setProcessing();

      toast({
        title: "Processing...",
        description: "Verifying upload and moving to library.",
      });

      const { songId, status } = await confirmUpload({
        uploadToken: token,
        expectedSize: selectedFile.size,
        expectedMime: (selectedFile.type || "audio/mpeg") as AudioMimeType,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        duration: audioDuration,
      });

      if (status !== "uploaded") {
        throw new Error(`Unexpected status: ${status}`);
      }

      uploadStore.completeUpload(songId);

      toast({
        title: "Upload complete!",
        description: `${selectedFile.name} has been added to your library.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not upload your file.";
      // if cancelled, msg is Upload cancelled — still treat as reset, not error toast duplication
      if (msg === "Upload cancelled") return;
      uploadStore.failUpload(msg);
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
      setSelectedFile(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // URL-based processing is Coming Soon in atomic as well
    if (!urlImportEnabled) return;
    // no-op when disabled; kept for parity
  };

  const handleCancelUpload = async () => {
    setShowCancelDialog(false);
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    const token = uploadTokenRef.current;
    const ext = (MIME_TO_EXT[mimeTypeRef.current] || "mp3") as "mp3" | "wav" | "flac" | "m4a" | "ogg";
    if (token) {
      cancelUpload(token, ext).catch(() => {});
    }
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setSelectedFile(null);
    uploadTokenRef.current = null;
    mimeTypeRef.current = "audio/mpeg";
    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadStore.reset();
    toast({ title: "Upload cancelled", description: "All resources have been cleaned up." });
  };

  const handleReset = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setShowCancelDialog(false);
    uploadTokenRef.current = null;
    xhrRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadStore.reset();
  };

  const displayFileName = selectedFile?.name || uploadStoreFileName;

  // ----- atomic styles helpers -----
  const cardStyle: React.CSSProperties = {
    background: tokens.sidebar,
    border: `1px solid ${tokens.borderColor}`,
    borderRadius: 20,
    boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" : "none",
  };
  const dropzoneStyle: React.CSSProperties = {
    background: isDragging ? tokens.hoverBg : tokens.sidebar,
    border: `1px dashed ${isDragging ? tokens.textPrimary : tokens.borderColor}`,
    borderRadius: 20,
    cursor: selectedFile ? "default" : "pointer",
    transition: `all 300ms ${motionTokens.easing.lux}`,
  };

  const primaryBtn: React.CSSProperties = {
    height: 44,
    padding: "0 20px",
    borderRadius: 12,
    border: "none",
    background: tokens.avatarBg,
    color: tokens.avatarText,
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: theme === "dark" ? "0 0 24px rgba(255,255,255,0.08)" : "0 1px 8px rgba(0,0,0,0.08)",
    transition: `transform 200ms ${motionTokens.easing.lux}, opacity 200ms ${motionTokens.easing.lux}`,
  };
  const outlineBtn: React.CSSProperties = {
    height: 44,
    padding: "0 20px",
    borderRadius: 12,
    border: `1px solid ${tokens.borderColor}`,
    background: "transparent",
    color: tokens.textPrimary,
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: `background 200ms ${motionTokens.easing.lux}`,
  };
  const destructiveBtn: React.CSSProperties = {
    ...outlineBtn,
    borderColor: "rgba(239,68,68,0.35)",
    color: "#EF4444",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 760, margin: "0 auto" }}>
      {/* header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: typography.fontAccent,
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "-0.03em",
            color: tokens.textPrimary,
            lineHeight: 1,
          }}
        >
          Upload
        </div>
        <div style={{ fontFamily: typography.fontSans, fontSize: 14, color: tokens.textMuted, lineHeight: 1.6 }}>
          Upload your audio files to get started. Supports {extensionLabels} up to {maxFileSizeLabel} • Max {maxDurationLabel}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {uploadedSongId ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] as any }}
          >
            <div style={{ ...cardStyle, padding: 36, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    theme === "dark"
                      ? "linear-gradient(to bottom, rgba(34,197,94,0.09), transparent 60%)"
                      : "linear-gradient(to bottom, rgba(34,197,94,0.07), transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "linear-gradient(to right, transparent, #22C55E, transparent)",
                  opacity: 0.9,
                }}
              />
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    background: "rgba(34,197,94,0.12)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 20px",
                    color: "#22C55E",
                    border: "1px solid rgba(34,197,94,0.18)",
                    boxShadow: "0 0 32px rgba(34,197,94,0.18)",
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <div style={{ fontFamily: typography.fontSans, fontSize: 22, fontWeight: 700, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  Upload Complete!
                </div>
                <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 6, wordBreak: "break-all" }}>{displayFileName}</div>
                {uploadStore.fileSize && (
                  <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2, fontFamily: typography.fontSans }}>
                    {(uploadStore.fileSize / 1024 / 1024).toFixed(2)}MB
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
                  <button
                    style={primaryBtn}
                    onClick={() => (window.location.href = `/songs/${uploadedSongId}`)}
                  >
                    Go to Player
                  </button>
                  <button
                    style={outlineBtn}
                    onClick={handleReset}
                    onMouseEnter={(e) => (e.currentTarget.style.background = tokens.hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : uploadStore.status === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] as any }}
          >
            <div style={{ ...cardStyle, padding: 36, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    theme === "dark"
                      ? "linear-gradient(to bottom, rgba(239,68,68,0.08), transparent 60%)"
                      : "linear-gradient(to bottom, rgba(239,68,68,0.06), transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "linear-gradient(to right, transparent, #EF4444, transparent)",
                  opacity: 0.9,
                }}
              />
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    background: "rgba(239,68,68,0.12)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 20px",
                    color: "#EF4444",
                    border: "1px solid rgba(239,68,68,0.18)",
                  }}
                >
                  <XCircle size={32} />
                </div>
                <div style={{ fontFamily: typography.fontSans, fontSize: 22, fontWeight: 700, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  Upload Failed
                </div>
                <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 6, wordBreak: "break-all" }}>{displayFileName}</div>
                <div style={{ fontSize: 13, color: "#EF4444", marginTop: 8 }}>{uploadStore.errorMessage}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
                  <button
                    style={outlineBtn}
                    onClick={handleReset}
                    onMouseEnter={(e) => (e.currentTarget.style.background = tokens.hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] as any }}
          >
            <div style={{ ...cardStyle, padding: 36, textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    theme === "dark"
                      ? `linear-gradient(to bottom, ${tokens.hoverBg}, transparent 60%)`
                      : "linear-gradient(to bottom, rgba(15,118,110,0.06), transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(to right, transparent, ${tokens.accent}, transparent)`,
                }}
              />
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    background: tokens.hoverBg,
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 20px",
                    color: tokens.textPrimary,
                    border: `1px solid ${tokens.borderColor}`,
                  }}
                >
                  {uploadStore.status === "processing" ? <Loader2 size={30} className="animate-spin" style={{ animation: "spinSlow 1.2s linear infinite" } as any} /> : <UploadIcon size={30} />}
                </div>
                <div style={{ fontFamily: typography.fontSans, fontSize: 22, fontWeight: 700, color: tokens.textPrimary, letterSpacing: "-0.02em" }}>
                  {uploadStore.status === "processing" ? "Processing..." : "Uploading..."}
                </div>
                <div style={{ fontSize: 13, color: tokens.textMuted, marginTop: 6, wordBreak: "break-all" }}>{displayFileName}</div>

                <div style={{ width: "100%", maxWidth: 420, margin: "20px auto 0", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: tokens.accent,
                        letterSpacing: "-0.01em",
                        fontFamily: typography.fontSans,
                      }}
                    >
                      {uploadProgress >= 95 && uploadProgress < 100
                        ? "Finalizing..."
                        : uploadStore.status === "processing"
                          ? "Verifying upload..."
                          : "Uploading..."}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: tokens.textMuted }}>{uploadProgress}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: tokens.themePillBg,
                      border: `1px solid ${tokens.borderColor}`,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: tokens.accent,
                        borderRadius: 999,
                        transition: `width 400ms ${motionTokens.easing.lux}`,
                      }}
                    />
                  </div>
                </div>

                {uploadStore.status === "uploading" && xhrRef.current && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    style={{ ...destructiveBtn, marginTop: 20 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <XCircle size={16} />
                    Cancel Upload
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] as any }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* dropzone */}
            <div
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                ...dropzoneStyle,
                padding: 36,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                minHeight: 220,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <input ref={fileInputRef} type="file" accept={acceptAttr} onChange={handleFileInputChange} style={{ display: "none" }} />
              {isDragging && (
                <motion.div
                  aria-hidden
                  style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none" }}
                  initial={{ boxShadow: `0 0 0 0 ${tokens.borderColor}` }}
                  animate={{ boxShadow: `0 0 0 8px transparent` }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" } as any}
                />
              )}
              {selectedFile ? (
                <>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      background: "rgba(34,197,94,0.12)",
                      color: "#22C55E",
                      display: "grid",
                      placeItems: "center",
                      border: "1px solid rgba(34,197,94,0.18)",
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div style={{ fontFamily: typography.fontSans, fontSize: 15, fontWeight: 700, color: "#22C55E" }}>File Selected</div>
                  <div style={{ fontSize: 13, color: tokens.textMuted, wordBreak: "break-all", maxWidth: 360 }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted, fontFamily: "ui-monospace, monospace" }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}MB • {audioDuration ? `${audioDuration}s` : "—"}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    style={{
                      marginTop: 4,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: `1px solid ${tokens.borderColor}`,
                      background: tokens.themePillBg,
                      color: tokens.textMuted,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Choose different file
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      background: tokens.themePillBg,
                      border: `1px solid ${tokens.borderColor}`,
                      display: "grid",
                      placeItems: "center",
                      color: tokens.textMuted,
                    }}
                  >
                    <UploadIcon size={20} />
                  </div>
                  <div style={{ fontFamily: typography.fontSans, fontSize: 15, fontWeight: 700, color: tokens.textPrimary }}>
                    {isDragging ? "Drop your audio file" : "Drag & Drop Audio"}
                  </div>
                  <div style={{ fontSize: 13, color: tokens.textMuted, maxWidth: 380, lineHeight: 1.5 }}>
                    Supports {extensionLabels} up to {maxFileSizeLabel} • Max {maxDurationLabel}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.accent, marginTop: 2 }}>Click to browse files</div>
                </>
              )}
            </div>

            {selectedFile && audioPreviewUrl && (
              <div
                style={{
                  ...cardStyle,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <audio controls src={audioPreviewUrl} style={{ width: "100%", height: 36, borderRadius: 12, display: "block" }} />
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: `1px solid ${tokens.borderColor}`,
                    background: tokens.themePillBg,
                    color: tokens.textMuted,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {selectedFile && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button onClick={handleFileUpload} style={primaryBtn}>
                  <UploadIcon size={16} />
                  Upload
                </button>
              </div>
            )}

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ height: 1, background: tokens.borderColor, flex: 1 }} />
              <span
                style={{
                  fontFamily: typography.fontSans,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: tokens.textMuted,
                }}
              >
                or
              </span>
              <div style={{ height: 1, background: tokens.borderColor, flex: 1 }} />
            </div>

            {/* url import (disabled when urlImportEnabled false) */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                gap: 10,
                opacity: urlImportEnabled ? 1 : 0.55,
                pointerEvents: urlImportEnabled ? "auto" : "none",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: tokens.textMuted,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <LinkIcon size={16} />
                </div>
                <input
                  placeholder={urlImportEnabled ? "Paste YouTube or SoundCloud URL..." : "Paste YouTube or SoundCloud URL (Coming Soon)..."}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={!urlImportEnabled}
                  style={{
                    width: "100%",
                    height: 48,
                    paddingLeft: 40,
                    paddingRight: 16,
                    borderRadius: 12,
                    border: `1px solid ${tokens.borderColor}`,
                    background: tokens.sidebar,
                    color: tokens.textPrimary,
                    fontFamily: typography.fontSans,
                    fontSize: 14,
                    outline: "none",
                    transition: `border-color 200ms ${motionTokens.easing.lux}, box-shadow 200ms ${motionTokens.easing.lux}`,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = tokens.textMuted)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = tokens.borderColor)}
                />
              </div>
              <button
                type="submit"
                disabled={!urlImportEnabled}
                style={{
                  ...primaryBtn,
                  height: 48,
                  opacity: urlImportEnabled ? 1 : 0.5,
                  cursor: urlImportEnabled ? "pointer" : "not-allowed",
                }}
              >
                Process
              </button>
            </form>
            {!urlImportEnabled && (
              <div style={{ fontSize: 11, color: tokens.textMuted, textAlign: "center", marginTop: -4, fontFamily: typography.fontSans }}>
                URL import is coming soon — file upload is available now.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* cancel dialog — atomic tokens, not shadcn */}
      {showCancelDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={() => setShowCancelDialog(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: tokens.backdrop,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] as any }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
              background: tokens.sidebar,
              border: `1px solid ${tokens.borderColor}`,
              borderRadius: 16,
              padding: 20,
              boxShadow: theme === "dark" ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 60px rgba(0,0,0,0.16)",
            }}
          >
            <div style={{ fontFamily: typography.fontSans, fontSize: 16, fontWeight: 700, color: tokens.textPrimary, letterSpacing: "-0.01em" }}>
              Cancel Upload?
            </div>
            <div style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.6, marginTop: 8 }}>
              Are you sure you want to cancel this upload? All progress will be lost and any uploaded data will be cleaned up from storage.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                style={{
                  ...outlineBtn,
                  height: 40,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = tokens.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Continue Upload
              </button>
              <button
                onClick={handleCancelUpload}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "#EF4444",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Yes, Cancel Upload
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default UploadView;
