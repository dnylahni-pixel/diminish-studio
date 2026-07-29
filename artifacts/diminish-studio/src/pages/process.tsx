import { useState, useEffect, useRef } from "react";
import { Upload as UploadIcon, Link as LinkIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  cancelUpload,
  confirmUpload,
  presignUpload,
  type AudioMimeType,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUploadStore } from "@/stores/uploadStore";

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

export function ProcessPage() {
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

  const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (matches server MAX_FILE_SIZE)
  const MAX_DURATION = 600; // 10 minutes in seconds

  // ── Sync: if there's an active upload in the store, we show its progress ──
  const isUploading = uploadStore.status === "uploading" || uploadStore.status === "processing";
  const uploadProgress = uploadStore.progress;
  const uploadedSongId = uploadStore.status === "completed" ? uploadStore.completedSongId : null;
  const uploadStoreFileName = uploadStore.fileName;

  const validateFileExtension = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  const validateAudioDuration = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration <= MAX_DURATION);
      });
      
      audio.addEventListener('error', () => {
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
        description: "Please upload MP3, WAV, FLAC, M4A, or OGG files only.",
        variant: "destructive",
      });
      return false;
    }

    if (!validateFileSize(file)) {
      toast({
        title: "File too large",
        description: `Maximum file size is 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return false;
    }

    const isDurationValid = await validateAudioDuration(file);
    if (!isDurationValid) {
      toast({
        title: "Audio too long",
        description: "Maximum duration is 10 minutes.",
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

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          // Cap at 95% during upload — last 5% is server ack (YouTube/Drive pattern)
          const rawPercent = (e.loaded / e.total) * 100;
          const capped = Math.min(95, Math.round(rawPercent));
          uploadStore.setProgress(capped);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          uploadStore.setProgress(100);
          resolve(true);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
      xhr.send(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    const isValid = await handleFileValidation(file);
    if (!isValid) return;

    // If there's an old completed/error state from a previous upload, dismiss it
    if (uploadStore.status === "completed" || uploadStore.status === "error") {
      uploadStore.reset();
    }

    setSelectedFile(file);

    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.addEventListener('loadedmetadata', () => {
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
  }, [audioPreviewUrl]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const mimeType = selectedFile.type || "audio/mpeg";
    mimeTypeRef.current = mimeType;

    // ── Start upload in global store ──
    uploadStore.startUpload(selectedFile.name, selectedFile.size);

    try {
      // Phase 1: Get presigned URL for quarantine bucket
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

      // Phase 2: PUT file to presigned URL
      const uploadSuccess = await uploadFileToPresignedUrl(selectedFile, uploadUrl);

      if (!uploadSuccess) {
        throw new Error('Upload failed');
      }

      // ── Transition to processing phase in store ──
      uploadStore.setProcessing();

      toast({
        title: "Processing...",
        description: "Verifying upload and moving to library.",
      });

      // Phase 3: Confirm upload (validates & copies from quarantine → songs/)
      const { songId, status } = await confirmUpload({
        uploadToken: token,
        expectedSize: selectedFile.size,
        expectedMime: (selectedFile.type || 'audio/mpeg') as AudioMimeType,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        duration: audioDuration,
      });

      if (status !== 'uploaded') {
        throw new Error(`Unexpected status: ${status}`);
      }

      // ── Upload complete in global store ──
      uploadStore.completeUpload(songId);

      toast({
        title: "Upload complete!",
        description: `${selectedFile.name} has been added to your library.`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not upload your file.";

      // ── Upload failed in global store ──
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
    if (file) {
      handleFileSelect(file);
    }
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
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    // URL-based processing removed — feature coming soon
  };

  const handleCancelUpload = async () => {
    setShowCancelDialog(false);

    // 1. Abort XHR if uploading
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    // 2. Tell server to remove quarantine object
    const token = uploadTokenRef.current;
    const ext = MIME_TO_EXT[mimeTypeRef.current] || "mp3";
    if (token) {
      cancelUpload(
        token,
        ext as "mp3" | "wav" | "flac" | "m4a" | "ogg",
      ).catch(() => {});
    }

    // 3. Full client cleanup
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl(null);
    setSelectedFile(null);
    uploadTokenRef.current = null;
    mimeTypeRef.current = "audio/mpeg";

    // 4. Reset file input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 5. Reset global store
    uploadStore.reset();

    toast({
      title: "Upload cancelled",
      description: "All resources have been cleaned up.",
    });
  };

  const handleReset = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setSelectedFile(null);
    setAudioPreviewUrl(null);
    setShowCancelDialog(false);
    uploadTokenRef.current = null;
    xhrRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset global store
    uploadStore.reset();
  };

  // ── Determine the file name to display (local file takes precedence) ──
  const displayFileName = selectedFile?.name || uploadStoreFileName;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Upload</h1>
        <p className="text-muted-foreground text-lg">Upload your audio files to get started.</p>
      </div>

      <AnimatePresence mode="wait">
        {uploadedSongId ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div className="w-full bg-card border border-card-border p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-50" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent" />
              
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)]">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Upload Complete!</h2>
                  <p className="text-muted-foreground mb-1">{displayFileName}</p>
                  <p className="text-muted-foreground text-sm">
                    {uploadStore.fileSize ? (uploadStore.fileSize / 1024 / 1024).toFixed(2) : ''}MB
                  </p>
                </motion.div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    className="h-12 px-8 font-bold bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)]"
                    onClick={() => window.location.href = `/songs/${uploadedSongId}`}
                  >
                    Go to Player
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 font-bold"
                    onClick={handleReset}
                  >
                    Upload Another
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : uploadStore.status === "error" ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div className="w-full bg-card border border-card-border p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-50" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
                  <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Upload Failed</h2>
                  <p className="text-muted-foreground mb-1">{displayFileName}</p>
                  <p className="text-red-400 text-sm mb-4">{uploadStore.errorMessage}</p>
                </motion.div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 font-bold"
                    onClick={handleReset}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : isUploading ? (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div className="w-full bg-card border border-card-border p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                    {uploadStore.status === "processing" ? (
                      <Loader2 className="w-12 h-12 animate-spin" />
                    ) : (
                      <UploadIcon className="w-12 h-12" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {uploadStore.status === "processing" ? "Processing..." : "Uploading..."}
                  </h2>
                  <p className="text-muted-foreground mb-1">{displayFileName}</p>
                  
                  {/* Progress bar */}
                  <div className="w-full max-w-md mx-auto mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">
                        {uploadProgress >= 95 && uploadProgress < 100
                          ? "Finalizing..."
                          : uploadStore.status === "processing"
                            ? "Verifying upload..."
                            : "Uploading..."}
                      </span>
                      <span className="text-sm font-mono text-primary">{uploadProgress}%</span>
                    </div>
                    <Progress 
                      value={uploadProgress} 
                      className="h-2 bg-muted"
                    />
                  </div>
                </motion.div>

                {/* Show cancel only if XHR is still alive (uploading phase, not processing) */}
                {uploadStore.status === "uploading" && xhrRef.current && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="h-12 px-6 rounded-xl border-destructive text-destructive hover:bg-destructive/10 font-bold"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel Upload
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full bg-card border border-card-border border-dashed rounded-3xl p-12 text-center hover:bg-card/80 hover:border-primary/50 transition-colors cursor-pointer mb-8 group relative overflow-hidden ${
                isDragging ? 'border-primary bg-primary/10 scale-105' : ''
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                 accept=".mp3,.wav,.flac,.m4a,.ogg,audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/ogg"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isDragging && (
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ boxShadow: "0 0 0 0 hsl(var(--primary) / 0.3)" }}
                  animate={{ boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              {selectedFile ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-green-500">File Selected</h3>
                  <p className="text-muted-foreground text-sm mb-2">{selectedFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </>
              ) : (
                <>
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                  <h3 className="text-xl font-bold mb-2">
                    {isDragging ? 'Drop your audio file' : 'Drag & Drop Audio'}
                  </h3>
                   <p className="text-muted-foreground text-sm">
                     Supports MP3, WAV, FLAC, M4A, OGG up to 100MB • Max 10 minutes
                   </p>
                  <p className="text-primary text-sm font-medium mt-3">Click to browse files</p>
                </>
              )}
            </div>

            {selectedFile && audioPreviewUrl && (
              <div className="w-full max-w-md mx-auto mb-6">
                <audio 
                  controls 
                  className="w-full h-10 rounded-lg"
                  src={audioPreviewUrl}
                />
              </div>
            )}

            {selectedFile && (
              <Button 
                onClick={() => {
                  handleFileUpload();
                }}
                className="mb-4 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_-5px_var(--color-primary)]"
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                Upload
              </Button>
            )}

            <div className="flex items-center w-full gap-4 mb-8">
              <div className="h-px bg-border flex-1" />
              <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">or</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="w-full flex gap-3 opacity-50 pointer-events-none">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Paste YouTube or SoundCloud URL (Coming Soon)..." 
                  className="h-14 pl-12 bg-background border-border text-lg rounded-xl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled
                />
              </div>
              <Button 
                type="submit" 
                className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_-5px_var(--color-primary)]"
                disabled
              >
                Process
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this upload? All progress will be lost
              and any uploaded data will be cleaned up from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Upload</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelUpload}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
