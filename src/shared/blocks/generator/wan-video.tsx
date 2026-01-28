'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Download, AlertCircle, LogIn, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ImageUploader } from '@/shared/blocks/common/image-uploader';
import { Meteors } from '@/shared/components/ui/meteors';
import { Particles } from '@/shared/components/ui/particles';
import { ShimmerButton } from '@/shared/components/ui/shimmer-button';
import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';

interface VideoGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GenerationType = 'text-to-video' | 'image-to-video';
type TaskStatus = 'idle' | 'generating' | 'completed' | 'failed';

function useWanVideoGenerator() {
  const [type, setType] = useState<GenerationType>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [quality, setQuality] = useState<'720p' | '1080p'>('720p');
  const [duration, setDuration] = useState<5 | 10 | 15>(5);

  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskId, setTaskId] = useState<string>('');
  const [provider, setProvider] = useState<'evolink' | 'replicate' | ''>('');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Poll task status
  useEffect(() => {
    if (!taskId || !provider || taskStatus !== 'generating') return;

    const interval = setInterval(async () => {
      try {
        console.log('[Frontend] Polling status for task:', taskId);
        const response = await fetch(
          `/api/ai/video/status?taskId=${taskId}&provider=${provider}`
        );
        const json = await response.json();

        console.log('[Frontend] Status response:', json);

        // Parse response based on format
        const data = json.data || json;
        const isSuccess = json.code === 0 || json.success || data.success;

        if (isSuccess) {
          setProgress(data.progress || 0);
          const normalizedStatus = String(data.status || '').toLowerCase();
          const isCompleted = ['completed', 'succeeded', 'success'].includes(
            normalizedStatus
          );
          const isFailed = ['failed', 'canceled', 'cancelled', 'error'].includes(
            normalizedStatus
          );
          const isProcessing = [
            'processing',
            'pending',
            'starting',
            'queued',
            'in_progress',
          ].includes(normalizedStatus);

          if (isCompleted) {
            console.log('[Frontend] Task completed! Video URL:', data.videoUrl);
            setTaskStatus('completed');
            setVideoUrl(data.videoUrl);
            setProgress(100);
          } else if (isFailed) {
            console.error('[Frontend] Task failed:', data.error);
            setTaskStatus('failed');
            setError(data.error?.message || 'Generation failed');
          } else if (isProcessing) {
            console.log('[Frontend] Task is processing, progress:', data.progress);
            setTaskStatus('generating');
          }
        } else {
          const message = json.message || data.details || data.error || 'Status check failed';
          console.error('[Frontend] Status check failed:', message);
          setTaskStatus('failed');
          setError(message);
        }
      } catch (err: any) {
        console.error('[Frontend] Failed to check status:', err);
        setTaskStatus('failed');
        setError(err.message || 'Failed to check status');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [taskId, provider, taskStatus]);

  const handleGenerate = async () => {
    setError('');
    setVideoUrl('');
    setProgress(0);

    if (type === 'text-to-video' && !prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (type === 'image-to-video' && !imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setTaskStatus('generating');

    try {
      console.log('[Frontend] Calling generate API:', {
        type,
        aspectRatio,
        quality,
        duration
      });

      const response = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          prompt: prompt || 'Animate this image',
          imageUrl: type === 'image-to-video' ? imageUrl : undefined,
          aspectRatio,
          quality,
          duration,
        }),
      });

      console.log('[Frontend] Generate API response status:', response.status);

      const json = await response.json();
      console.log('[Frontend] Generate API response:', json);

      if (!response.ok || json.code !== 0) {
        throw new Error(json.data?.details || json.data?.error || json.message || 'Failed to start generation');
      }

      const data = json.data;
      if (data.success) {
        setTaskId(data.taskId);
        setProvider(data.provider || '');
        console.log('[Frontend] Task created successfully:', data.taskId);
      } else {
        setTaskStatus('failed');
        setError(data.error || 'Failed to start generation');
      }
    } catch (err: any) {
      console.error('[Frontend] Generate error:', err);
      setTaskStatus('failed');
      setError(err.message || 'Failed to start generation');
    }
  };

  const handleReset = () => {
    setTaskStatus('idle');
    setTaskId('');
    setProvider('');
    setProgress(0);
    setVideoUrl('');
    setError('');
  };

  const isGenerating = taskStatus === 'generating';

  // Download video using a same-origin proxy to avoid CORS issues.
  const downloadVideo = async (url: string, filename: string) => {
    try {
      const resp = await fetch(`/api/proxy/file?url=${encodeURIComponent(url)}`);
      if (!resp.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
    } catch (err) {
      console.error('[Frontend] Failed to download video:', err);
    }
  };

  return {
    type,
    setType,
    prompt,
    setPrompt,
    imageUrl,
    setImageUrl,
    aspectRatio,
    setAspectRatio,
    quality,
    setQuality,
    duration,
    setDuration,
    taskStatus,
    setTaskStatus,
    taskId,
    provider,
    progress,
    videoUrl,
    error,
    setError,
    isGenerating,
    handleGenerate,
    handleReset,
    downloadVideo,
  };
}

export function WanVideoGenerator({ open, onOpenChange }: VideoGeneratorProps) {
  const {
    type,
    setType,
    prompt,
    setPrompt,
    imageUrl,
    setImageUrl,
    aspectRatio,
    setAspectRatio,
    quality,
    setQuality,
    duration,
    setDuration,
    taskStatus,
    taskId,
    progress,
    videoUrl,
    error,
    isGenerating,
    handleGenerate,
    handleReset,
    downloadVideo,
  } = useWanVideoGenerator();

  const proxiedVideoUrl = videoUrl
    ? `/api/proxy/file?url=${encodeURIComponent(videoUrl)}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="size-5 text-purple-400" />
            AI Video Generator
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Create stunning videos with Wan 2.6 AI technology
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as GenerationType)}>
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="text-to-video" className="data-[state=active]:bg-white/10">
              Text to Video
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="data-[state=active]:bg-white/10">
              Image to Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text-to-video" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-white">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="A cinematic drone shot of a futuristic city at night with neon lights..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={isGenerating}
                maxLength={1500}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">
                {prompt.length}/1500 characters
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image-to-video" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
              <input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isGenerating}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagePrompt" className="text-white">Motion Description (Optional)</Label>
              <Textarea
                id="imagePrompt"
                placeholder="Describe how you want the image to move..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                disabled={isGenerating}
                maxLength={1500}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>
          </TabsContent>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-white">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={(v: any) => setAspectRatio(v)}
                disabled={isGenerating}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 Landscape</SelectItem>
                  <SelectItem value="9:16">9:16 Portrait</SelectItem>
                  <SelectItem value="1:1">1:1 Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Quality</Label>
              <Select
                value={quality}
                onValueChange={(v: any) => setQuality(v)}
                disabled={isGenerating}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p Standard</SelectItem>
                  <SelectItem value="1080p">1080p High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Duration</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v) as 5 | 10 | 15)}
                disabled={isGenerating}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Tabs>

        {/* Status Display */}
        {taskStatus !== 'idle' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Loader2 className="size-4 animate-spin text-purple-400" />
                  <span>Generating your video...</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-white/50">
                  Task ID: {taskId}
                </p>
              </div>
            )}

            {taskStatus === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Sparkles className="size-4" />
                  <span>Video generated successfully!</span>
                </div>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-white/50 space-y-1">
                    <p>videoUrl: {videoUrl ? videoUrl.substring(0, 50) + '...' : 'null'}</p>
                    <p>proxiedVideoUrl: {proxiedVideoUrl ? proxiedVideoUrl.substring(0, 50) + '...' : 'null'}</p>
                  </div>
                )}
                {videoUrl ? (
                  <>
                    <video
                      key={proxiedVideoUrl || videoUrl}
                      src={proxiedVideoUrl || videoUrl}
                      controls
                      className="w-full rounded-lg bg-black"
                      autoPlay
                      loop
                      onError={(e) => {
                        console.error('[Video] Error loading video:', e);
                        console.error('[Video] videoUrl:', videoUrl);
                        console.error('[Video] Native error:', (e.target as HTMLVideoElement).error);
                      }}
                      onLoadStart={() => {
                        console.log('[Video] Loading video:', videoUrl);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          if (!videoUrl) return;
                          downloadVideo(videoUrl, `wan-ai-video-${Date.now()}.mp4`);
                        }}
                      >
                        <Download className="size-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={handleReset}
                      >
                        Create Another
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-400">Video URL not available. Please check the task details.</p>
                    <p className="text-xs text-white/50">Task ID: {taskId}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={handleReset}
                    >
                      Create Another
                    </Button>
                  </div>
                )}
              </div>
            )}

            {taskStatus === 'failed' && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="size-4 mt-0.5" />
                <div>
                  <p className="font-medium">Generation failed</p>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {taskStatus === 'idle' && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <ShimmerButton
              onClick={handleGenerate}
              className="h-10 px-6"
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
            >
              <Sparkles className="size-4 mr-2" />
              Generate Video
            </ShimmerButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WanVideoGeneratorInline({
  className,
}: {
  className?: string;
}) {
  // Get user session
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const {
    type,
    setType,
    prompt,
    setPrompt,
    imageUrl,
    setImageUrl,
    aspectRatio,
    setAspectRatio,
    duration,
    setDuration,
    taskStatus,
    setTaskStatus,
    taskId,
    provider,
    progress,
    videoUrl,
    error,
    setError,
    isGenerating,
    handleGenerate,
    handleReset,
    downloadVideo,
  } = useWanVideoGenerator();

  // Check if error is auth-related or credits-related
  const isAuthError = error?.toLowerCase().includes('no auth') || error?.toLowerCase().includes('please sign in');
  const isCreditsError = error?.toLowerCase().includes('insufficient credits');

  const proxiedVideoUrl = videoUrl
    ? `/api/proxy/file?url=${encodeURIComponent(videoUrl)}`
    : '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/8 bg-[#0b1324]/82 backdrop-blur-xl p-6 shadow-[0_40px_140px_rgba(7,10,24,0.65)]',
        className
      )}
    >
      {/* Particles Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl opacity-70">
        <Particles
          className="absolute inset-0"
          quantity={20}
          ease={80}
          color="#d9e4ff"
          refresh
        />
      </div>

      {/* Meteors Effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl opacity-30">
        <Meteors number={4} />
      </div>

      {/* Ambient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(120,140,255,0.12),transparent_45%)]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12 pt-6 md:pt-10">
          <div className="inline-flex items-center gap-4 mb-5">
            <div className="rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3">
              <Sparkles className="size-6 text-purple-300" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent tracking-tight">
              AI Video Generator
            </h1>
            <div className="rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-3">
              <Sparkles className="size-6 text-pink-300" />
            </div>
          </div>
          <p className="text-white/70 text-base md:text-lg">
            Transform your ideas into stunning videos with AI
          </p>
        </div>

        {/* Main Content */}
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(7,10,24,0.35)] backdrop-blur-sm md:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Input</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Creative Brief</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                {prompt.length}/2500
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <Tabs value={type} onValueChange={(v) => setType(v as GenerationType)}>
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white/5 p-1">
                  <TabsTrigger
                    value="text-to-video"
                    className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    Text to Video
                  </TabsTrigger>
                  <TabsTrigger
                    value="image-to-video"
                    className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    Image to Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text-to-video" className="space-y-4 pt-4">
                  <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Prompt
                  </Label>
                  <Textarea
                    placeholder="Describe your video: A cinematic shot of a futuristic city at night with neon lights reflecting on wet streets, 16:9..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    disabled={isGenerating}
                    maxLength={2500}
                    className="min-h-[160px] rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/40 focus:border-white/30"
                  />
                </TabsContent>

                <TabsContent value="image-to-video" className="space-y-4 pt-4">
                  <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Reference Image
                  </Label>
                  <ImageUploader
                    title="Upload reference image (optional)"
                    emptyHint="JPG, PNG, WebP, GIF up to 5MB"
                    maxImages={1}
                    maxSizeMB={5}
                    onChange={(items) => {
                      const uploaded = items.find(
                        (item) => item.status === 'uploaded' && item.url
                      );
                      setImageUrl(uploaded?.url || '');
                    }}
                    className="rounded-xl border border-dashed border-white/15 bg-black/25"
                  />
                  <Textarea
                    placeholder="Describe how you want the image to move..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    disabled={isGenerating}
                    maxLength={1500}
                    className="rounded-xl border-white/10 bg-black/30 text-white placeholder:text-white/40 focus:border-white/30"
                  />
                </TabsContent>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Duration
                  </Label>
                  <Select
                    value={String(duration)}
                    onValueChange={(v) => setDuration(Number(v) as 5 | 10 | 15)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="rounded-xl border-white/10 bg-black/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Aspect Ratio
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                      <Button
                        key={ratio}
                        type="button"
                        variant="outline"
                        onClick={() => setAspectRatio(ratio)}
                        disabled={isGenerating}
                        className={cn(
                          'h-10 rounded-lg border-white/10 bg-black/30 text-white/80 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                          aspectRatio === ratio &&
                            'border-purple-300/60 bg-gradient-to-r from-purple-500/35 to-pink-500/30 text-white shadow-[0_0_0_1px_rgba(192,132,252,0.5),0_8px_18px_rgba(147,51,234,0.25)]'
                        )}
                      >
                        {ratio}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <ShimmerButton
                onClick={() => {
                  if (!isAuthenticated) {
                    setError('Please sign in to generate videos');
                    setTaskStatus('failed');
                    return;
                  }
                  handleGenerate();
                }}
                disabled={isGenerating}
                className="h-14 w-full rounded-xl border border-white/10 bg-gradient-to-b from-fuchsia-500 via-purple-600 to-indigo-700 text-white text-base font-semibold shadow-[0_18px_30px_rgba(76,29,149,0.45),0_6px_12px_rgba(15,23,42,0.6),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                shimmerColor="#ffffff"
                shimmerSize="0.1em"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Creating...
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <LogIn className="mr-2 size-5" />
                    Sign In to Create
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-5" />
                    Start Creating
                  </>
                )}
              </ShimmerButton>

              {taskStatus === 'failed' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 size-4" />
                  <div className="flex-1">
                    <p className="font-medium">Generation failed</p>
                    <p className="text-xs mt-1">{error}</p>
                    {isAuthError && (
                      <Link href="/auth/signin">
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 border-red-400/30 text-red-200 hover:bg-red-500/20 hover:text-red-100"
                        >
                          <LogIn className="mr-1.5 size-3.5" />
                          Sign In to Generate
                        </Button>
                      </Link>
                    )}
                    {isCreditsError && (
                      <Link href="/pricing">
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/20 hover:text-yellow-100"
                        >
                          <Wallet className="mr-1.5 size-3.5" />
                          Get More Credits
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Video Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(7,10,24,0.35)] backdrop-blur-sm md:p-6 flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Generated Video
                </p>
                <p className="mt-2 text-sm text-white/60">Preview & downloads</p>
              </div>
              <div
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  isGenerating && 'border-purple-400/40 bg-purple-500/10 text-purple-200',
                  !isGenerating &&
                    taskStatus === 'completed' &&
                    'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
                  !isGenerating &&
                    taskStatus !== 'completed' &&
                    'border-white/15 bg-white/5 text-white/60'
                )}
              >
                {isGenerating ? 'Rendering' : taskStatus === 'completed' ? 'Ready' : 'Waiting'}
              </div>
            </div>

            <div className="mt-5 flex flex-1 flex-col">
              <div className="relative flex-1 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top,#1b2138_0%,rgba(6,10,22,0.9)_55%,rgba(2,4,12,1)_100%)] p-3">
                <div className="absolute inset-0 opacity-40 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%),linear-gradient(0deg,rgba(255,255,255,0.03),transparent_35%)]" />
                <div className="relative h-full w-full rounded-lg border border-white/10 bg-black/40 shadow-[inset_0_0_30px_rgba(0,0,0,0.55)]">
                  {taskStatus === 'completed' && videoUrl ? (
                    <>
                      {process.env.NODE_ENV === 'development' && (
                        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 text-xs text-white p-1 break-all">
                          videoUrl exists: {videoUrl}
                        </div>
                      )}
                      <video
                        key={proxiedVideoUrl || videoUrl}
                        src={proxiedVideoUrl || videoUrl}
                        controls
                        className="h-full w-full object-contain"
                        autoPlay
                        loop
                        onError={(e) => {
                          console.error('[Inline Video] ========== VIDEO ERROR ==========');
                          console.error('[Inline Video] videoUrl:', videoUrl);
                          console.error('[Inline Video] videoUrl type:', typeof videoUrl);
                          console.error('[Inline Video] videoUrl length:', videoUrl?.length);
                          console.error('[Inline Video] Error event:', e);
                          console.error('[Inline Video] Native error:', (e.target as HTMLVideoElement).error);
                          console.error('[Inline Video] Network state:', (e.target as HTMLVideoElement).networkState);
                        }}
                        onLoadStart={() => {
                          console.log('[Inline Video] ========== VIDEO LOADING ==========');
                          console.log('[Inline Video] videoUrl:', videoUrl);
                        }}
                        onLoadedData={(e) => {
                          console.log('[Inline Video] ========== VIDEO LOADED ==========');
                          console.log('[Inline Video] Duration:', (e.target as HTMLVideoElement).duration);
                        }}
                      />
                    </>
                  ) : taskStatus === 'completed' && !videoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/20">
                      <div className="text-center p-4">
                        <p className="text-yellow-300 font-medium">⚠️ Video URL is empty!</p>
                        <p className="text-xs text-yellow-200/70 mt-2">Task ID: {taskId}</p>
                        <p className="text-xs text-yellow-200/70">Provider: {provider}</p>
                        {process.env.NODE_ENV === 'development' && (
                          <button
                            onClick={() =>
                              console.log('Debug State:', { taskStatus, videoUrl, taskId, provider, progress })
                            }
                            className="mt-2 px-2 py-1 bg-yellow-500/30 rounded text-xs"
                          >
                            Log State to Console
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.18),transparent_60%)]" />
                      <div className="text-center">
                        <Sparkles className="mx-auto mb-2 size-8 text-white/30" />
                        <p className="text-sm text-white/40">Your video will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isGenerating && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Loader2 className="size-4 animate-spin text-purple-400" />
                    <span>Generating your video...</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50 text-center">{progress}% complete</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!videoUrl || taskStatus !== 'completed'}
                  onClick={() => {
                    if (!videoUrl) return;
                    downloadVideo(videoUrl, `wan-ai-video-${Date.now()}.mp4`);
                  }}
                >
                  <Download className="mr-2 size-4" />
                  Download
                </Button>
                {taskStatus === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={handleReset}
                  >
                    Create Another
                  </Button>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Cost per generation</span>
                  <span className="text-white font-semibold">20 credits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
