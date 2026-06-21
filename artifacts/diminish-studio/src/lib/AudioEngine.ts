// AudioEngine.ts

type LoadingStatus = 'pending' | 'loading' | 'loaded' | 'error';

type LoadProgressCallback = (id: string, status: LoadingStatus) => void;
type EndedCallback = () => void;

class AudioEngine {
  private context: AudioContext;
  private buffers: Map<string, AudioBuffer> = new Map();
  private sources: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  
  private startTime: number = 0; // زمان شروع پخش در context
  private pausedAt: number = 0;  // زمانی که آهنگ متوقف شده
  private isPlaying: boolean = false;

  // Volume state management
  private previousVolumes: Map<string, number> = new Map();
  private mutedTracks: Set<string> = new Set();

  // Loading state management
  private loadingStatus: Map<string, LoadingStatus> = new Map();
  private onLoadProgressCallback?: LoadProgressCallback;
  private onEndedCallback?: EndedCallback;

  // شمارندهٔ سورس‌های فعال (برای تشخیص پایان واقعی)
  private activeSourceCount: number = 0;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Callback registration
  onLoadProgress(callback: LoadProgressCallback): void {
    this.onLoadProgressCallback = callback;
  }

  onEnded(callback: EndedCallback): void {
    this.onEndedCallback = callback;
  }

  // ۱. متد لود کردن استم‌ها
  async loadTrack(id: string, url: string): Promise<void> {
    this.loadingStatus.set(id, 'loading');
    this.onLoadProgressCallback?.(id, 'loading');

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.buffers.set(id, audioBuffer);

      // ساخت گین نود برای این ترک (میکسر)
      const gainNode = this.context.createGain();
      gainNode.connect(this.context.destination);
      this.gainNodes.set(id, gainNode);

      this.loadingStatus.set(id, 'loaded');
      this.onLoadProgressCallback?.(id, 'loaded');
    } catch (error) {
      console.error(`Failed to load track ${id}:`, error);
      this.loadingStatus.set(id, 'error');
      this.onLoadProgressCallback?.(id, 'error');
      // Don't throw - allow other stems to load
    }
  }

  // Get loading progress
  getLoadingProgress(): { loaded: number; total: number } {
    const total = this.loadingStatus.size;
    let loaded = 0;
    
    this.loadingStatus.forEach((status) => {
      if (status === 'loaded') loaded++;
    });

    return { loaded, total };
  }

  // Get failed tracks
  getFailedTracks(): string[] {
    const failed: string[] = [];
    this.loadingStatus.forEach((status, id) => {
      if (status === 'error') failed.push(id);
    });
    return failed;
  }

  // Check if all tracks are loaded
  private areAllTracksLoaded(): boolean {
    for (const status of this.loadingStatus.values()) {
      if (status !== 'loaded') return false;
    }
    return this.buffers.size > 0;
  }

  // ۲. متد اصلی پخش (پل بین بافر و خروجی)
  play(offset: number = 0): boolean {
    if (this.isPlaying) return false;

    if (!this.areAllTracksLoaded()) {
      console.warn('Cannot play: not all tracks are loaded');
      return false;
    }

    this.context.resume();

    // ریست شمارنده سورس‌های فعال
    this.activeSourceCount = 0;

    this.buffers.forEach((buffer, id) => {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = this.gainNodes.get(id);
      if (gainNode) source.connect(gainNode);

      // افزایش شمارنده به ازای هر سورس
      this.activeSourceCount++;

      source.onended = () => {
        this.activeSourceCount--;
        // تنها وقتی همه تمام شده باشند پخش پایان می‌یابد
        if (this.activeSourceCount === 0 && this.isPlaying) {
          this.sources.clear();
          this.isPlaying = false;
          this.pausedAt = 0;
          this.onEndedCallback?.();
        }
      };

      source.start(0, offset);
      this.sources.set(id, source);
    });

    this.startTime = this.context.currentTime - offset;
    this.isPlaying = true;
    return true;
  }

  pause(): void {
    if (!this.isPlaying) return;
    
    this.sources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.sources.clear();
    this.activeSourceCount = 0;  // ریست شمارنده

    this.pausedAt = this.context.currentTime - this.startTime;
    this.isPlaying = false;
  }

  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    
    if (this.isPlaying) {
      this.sources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Already stopped
        }
      });
      this.sources.clear();
      this.isPlaying = false;
    }

    this.pausedAt = time;

    if (wasPlaying) {
      this.play(time);
    }
  }

  getCurrentTime(): number {
    if (this.isPlaying) {
      return this.context.currentTime - this.startTime;
    }
    return this.pausedAt;
  }

  // تنظیم ولوم برای میکسر
  setVolume(id: string, volume: number): void {
    const gainNode = this.gainNodes.get(id);
    if (!gainNode) return;

    if (this.mutedTracks.has(id)) {
      this.previousVolumes.set(id, volume);
      return;
    }

    gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.02);
    this.previousVolumes.set(id, volume);
  }

  // Mute/unmute functionality
  setMuted(id: string, muted: boolean): void {
    const gainNode = this.gainNodes.get(id);
    if (!gainNode) return;

    if (muted) {
      if (!this.mutedTracks.has(id)) {
        const currentVolume = this.previousVolumes.get(id) ?? gainNode.gain.value;
        this.previousVolumes.set(id, currentVolume);
        this.mutedTracks.add(id);
      }
      
      gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.02);
    } else {
      this.mutedTracks.delete(id);
      const previousVolume = this.previousVolumes.get(id) ?? 0.8;
      gainNode.gain.setTargetAtTime(previousVolume, this.context.currentTime, 0.02);
    }
  }

  // Get mute status
  isMuted(id: string): boolean {
    return this.mutedTracks.has(id);
  }

  // Cleanup
  dispose(): void {
    this.pause();
    this.buffers.clear();
    this.gainNodes.forEach(node => node.disconnect());
    this.gainNodes.clear();
    this.previousVolumes.clear();
    this.mutedTracks.clear();
    this.loadingStatus.clear();
    this.context.close();
  }
}

export const audioEngine = new AudioEngine();