import { useState, useEffect, useRef } from "react";
import { Upload as UploadIcon, Link as LinkIcon, Loader2, Music, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProcessSong, useGetProcessingJob, getGetProcessingJobQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function ProcessPage() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Allowed formats and constraints
  const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_DURATION = 600; // 10 minutes in seconds
  
  const processMutation = useProcessSong();
  const { data: job } = useGetProcessingJob(jobId || "", {
    query: { 
      enabled: !!jobId, 
      queryKey: getGetProcessingJobQueryKey(jobId || ""),
      refetchInterval: (query) => (query.state.data?.status === 'done' || query.state.data?.status === 'error') ? false : 2000
    }
  });

  // Validate file extension
  const validateFileExtension = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  // Validate file size
  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  // Validate audio duration using Web Audio API
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

  // Handle file validation
  const handleFileValidation = async (file: File) => {
    // Check extension
    if (!validateFileExtension(file)) {
      toast({
        title: "Invalid file format",
        description: "Please upload MP3, WAV, or FLAC files only.",
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    if (!validateFileSize(file)) {
      toast({
        title: "File too large",
        description: `Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return false;
    }

    // Check duration
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

  // Upload file to presigned URL with progress tracking
  const uploadFileToPresignedUrl = async (file: File, presignedUrl: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
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

  // Handle file selection and upload
  const handleFileSelect = async (file: File) => {
    const isValid = await handleFileValidation(file);
    if (!isValid) return;

    setSelectedFile(file);

    // Get audio duration
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(Math.ceil(audio.duration));
    });
    audio.src = objectUrl;

    // Create audio preview URL
    setAudioPreviewUrl(objectUrl);

    toast({
      title: "File ready",
      description: `${file.name} is ready to upload.`,
    });
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Handle upload button click
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      // Step 1: Request presigned URL from backend
      toast({
        title: "Requesting upload URL...",
        description: "Preparing secure upload link.",
      });

      const response = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'audio/mpeg',
          duration: audioDuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, songId, fileKey } = await response.json();

      // Step 2: Upload file directly to Backblaze B2
      toast({
        title: "Uploading...",
        description: "Uploading your file to storage.",
      });

      const uploadSuccess = await uploadFileToPresignedUrl(selectedFile, uploadUrl);

      if (!uploadSuccess) {
        throw new Error('Upload failed');
      }

      // Step 3: Start processing with the song
      toast({
        title: "Starting processing...",
        description: "Your file is being analyzed.",
      });

      processMutation.mutate(
        { data: { source: songId } },
        {
          onSuccess: (data) => {
            setJobId(data.jobId);
            toast({
              title: "Processing started!",
              description: "Your audio is being processed.",
            });
          },
          onError: () => {
            toast({
              title: "Processing failed",
              description: "Could not start processing your file.",
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload your file.",
        variant: "destructive",
      });
      setSelectedFile(null);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
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
    
    processMutation.mutate(
      { data: { source: url } },
      {
        onSuccess: (data) => setJobId(data.jobId),
        onError: () => toast({ title: "Failed to start processing", variant: "destructive" })
      }
    );
  };

  const getStatusText = (status?: string) => {
    switch(status) {
      case 'queued': return 'Waiting in queue...';
      case 'analyzing': return 'Analyzing audio spectrum...';
      case 'extracting_chords': return 'Extracting harmonic data...';
      case 'syncing_lyrics': return 'Synchronizing lyrics to beats...';
      case 'finalizing': return 'Finalizing project...';
      case 'done': return 'Processing complete!';
      case 'error': return 'Processing failed.';
      default: return '';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Process</h1>
        <p className="text-muted-foreground text-lg">Extract chords and sync lyrics from any audio.</p>
      </div>

      <AnimatePresence mode="wait">
        {!jobId ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
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
                accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isDragging && (
                <motion.svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <motion.rect
                    x="1.5"
                    y="1.5"
                    width="97"
                    height="97"
                    rx="4"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeDasharray="8 8"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -32 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.svg>
              )}
              {selectedFile ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-green-500">File Selected</h3>
                  <p className="text-muted-foreground text-sm mb-2">{selectedFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                  
                  {/* Audio Preview Player */}
                  {audioPreviewUrl && (
                    <div className="mt-6 w-full max-w-md mx-auto">
                      <audio 
                        controls 
                        className="w-full h-10 rounded-lg"
                        src={audioPreviewUrl}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-6 w-full max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Uploading...</span>
                        <span className="text-sm font-mono text-primary">{uploadProgress}%</span>
                      </div>
                      <Progress 
                        value={uploadProgress} 
                        className="h-2 bg-muted"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUploading(true);
                      handleFileUpload();
                    }}
                    className="mt-6 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_-5px_var(--color-primary)]"
                    disabled={isUploading || processMutation.isPending}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                  <h3 className="text-xl font-bold mb-2">
                    {isDragging ? 'Drop your audio file' : 'Drag & Drop Audio'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Supports MP3, WAV, FLAC up to 50MB • Max 10 minutes
                  </p>
                  <p className="text-primary text-sm font-medium mt-3">Click to browse files</p>
                </>
              )}
            </div>

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
        ) : (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full"
          >
            <div className="w-full bg-card border border-card-border p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              <div className="relative z-10">
                {job?.status === 'done' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)]">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Song Ready</h2>
                    <Button size="lg" className="h-12 px-8 font-bold bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)]" onClick={() => window.location.href = `/songs/${job.songId}`}>
                      Open in Player
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="relative w-32 h-32 mx-auto mb-8">
                      <div className="absolute inset-0 border-4 border-muted rounded-full" />
                      <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Music className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 animate-pulse">{getStatusText(job?.status)}</h2>
                    <p className="text-muted-foreground font-mono mb-8">{job?.progress || 0}% Complete</p>
                    <Progress value={job?.progress || 0} className="h-2 w-full bg-muted" />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
