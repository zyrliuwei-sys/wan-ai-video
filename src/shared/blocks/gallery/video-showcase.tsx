'use client';

import { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface VideoCase {
  id: number;
  title: string;
  prompt: string;
  video: string;
  thumbnail: string;
  category: string;
  duration: string;
  aspectRatio: string;
}

interface VideoShowcaseProps {
  className?: string;
}

export function VideoShowcase({ className }: VideoShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const cases: VideoCase[] = [
    {
      id: 1,
      title: 'Serene Sunset',
      prompt: 'A cinematic drone shot of a serene sunset over the ocean, golden hour lighting, waves gently crashing on the sandy beach, seagulls flying in the distance...',
      video: '/videos/gallery/sunset-ocean.mp4',
      thumbnail: '/videos/gallery/sunset-ocean-thumb.jpg',
      category: 'Nature',
      duration: '5s',
      aspectRatio: '16:9',
    },
    {
      id: 2,
      title: 'Neon City',
      prompt: 'Futuristic cyberpunk city at night, neon lights reflecting on wet streets, flying cars zooming through holographic billboards...',
      video: '/videos/gallery/neon-city.mp4',
      thumbnail: '/videos/gallery/neon-city-thumb.jpg',
      category: 'Sci-Fi',
      duration: '5s',
      aspectRatio: '16:9',
    },
    {
      id: 3,
      title: 'Dance Motion',
      prompt: 'Professional ballet dancer performing in a spotlight, elegant slow motion pirouette, flowing white dress with sequins sparkling...',
      video: '/videos/gallery/ballet-dance.mp4',
      thumbnail: '/videos/gallery/ballet-dance-thumb.jpg',
      category: 'People',
      duration: '5s',
      aspectRatio: '16:9',
    },
    {
      id: 4,
      title: 'Fluffy Friend',
      prompt: 'Adorable golden retriever puppy playing in autumn leaves, sunlight filtering through trees, slow motion capture...',
      video: '/videos/gallery/puppy-autumn.mp4',
      thumbnail: '/videos/gallery/puppy-autumn-thumb.jpg',
      category: 'Animals',
      duration: '5s',
      aspectRatio: '16:9',
    },
    {
      id: 5,
      title: 'Cosmic Journey',
      prompt: 'Spaceship traveling through a colorful nebula in deep space, vibrant purple and blue cosmic clouds...',
      video: '/videos/gallery/space-nebula.mp4',
      thumbnail: '/videos/gallery/space-nebula-thumb.jpg',
      category: 'Sci-Fi',
      duration: '5s',
      aspectRatio: '16:9',
    },
    {
      id: 6,
      title: 'Flow Art',
      prompt: 'Abstract colorful ink flowing in water, vibrant swirls of blue, pink and gold colors mixing gracefully...',
      video: '/videos/gallery/ink-flow.mp4',
      thumbnail: '/videos/gallery/ink-flow-thumb.jpg',
      category: 'Abstract',
      duration: '5s',
      aspectRatio: '16:9',
    },
  ];

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-slate-950 py-24 md:py-32',
        className
      )}
    >
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-sm">
            <Sparkles className="size-3.5 text-purple-400" />
            <span className="text-purple-300 font-medium">AI Video Gallery</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
            Explore What's Possible
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See what our community has created with AI. Hover over any video to preview.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((videoCase) => (
            <div
              key={videoCase.id}
              className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 overflow-hidden shadow-xl"
              onMouseEnter={() => {
                setHoveredId(videoCase.id);
                setMounted(true);
              }}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Video Thumbnail */}
              <div className="aspect-video relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                {hoveredId === videoCase.id && mounted ? (
                  <video
                    src={videoCase.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Video not available, show placeholder
                      (e.target as HTMLVideoElement).style.display = 'none';
                      const placeholder = e.currentTarget?.querySelector('.placeholder-content');
                      if (placeholder) {
                        (placeholder as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="size-12 text-white/40" />
                  </div>
                )}

                {/* Placeholder (shown when video not available) */}
                <div className="placeholder-content absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900" style={{ display: 'none' }}>
                  <div className="text-center p-4">
                    <Play className="mx-auto mb-2 size-10 text-white/30" />
                    <p className="text-sm text-white/40">Video coming soon</p>
                  </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium text-white">
                    {videoCase.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {videoCase.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                  {videoCase.prompt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {videoCase.duration} • {videoCase.aspectRatio}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-purple-300 hover:text-purple-200 hover:bg-white/10"
                  >
                    Use Prompt
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Ready to create your own?</p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            onClick={() => {
              document.getElementById('wan-generator')?.scrollIntoView({
                behavior: 'smooth',
              });
            }}
          >
            <Sparkles className="mr-2 size-5" />
            Start Creating
          </Button>
        </div>
      </div>
    </section>
  );
}
