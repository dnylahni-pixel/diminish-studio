import { useState, useEffect } from "react";
import { Upload as UploadIcon, Link as LinkIcon, Loader2, Music, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProcessSong, useGetProcessingJob, getGetProcessingJobQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function ProcessPage() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const processMutation = useProcessSong();
  const { data: job } = useGetProcessingJob(jobId || "", {
    query: { 
      enabled: !!jobId, 
      queryKey: getGetProcessingJobQueryKey(jobId || ""),
      refetchInterval: (query) => (query.state.data?.status === 'done' || query.state.data?.status === 'error') ? false : 2000
    }
  });

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
            <div className="w-full bg-card border border-card-border border-dashed rounded-3xl p-12 text-center hover:bg-card/80 hover:border-primary/50 transition-colors cursor-pointer mb-8 group relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
              <h3 className="text-xl font-bold mb-2">Drag & Drop Audio</h3>
              <p className="text-muted-foreground text-sm">Supports MP3, WAV, FLAC up to 50MB</p>
            </div>

            <div className="flex items-center w-full gap-4 mb-8">
              <div className="h-px bg-border flex-1" />
              <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">or</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="w-full flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Paste YouTube or SoundCloud URL..." 
                  className="h-14 pl-12 bg-background border-border text-lg rounded-xl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_-5px_var(--color-primary)]">
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
