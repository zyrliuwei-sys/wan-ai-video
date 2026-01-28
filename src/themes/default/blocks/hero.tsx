'use client';

import Image from 'next/image';
import { ArrowRight, Play, Sparkles, Video, Zap } from 'lucide-react';
import { useRef } from 'react';

import { Link } from '@/core/i18n/navigation';
import { WanVideoGeneratorInline } from '@/shared/blocks/generator/wan-video';
import { VideoShowcase } from '@/shared/blocks/gallery/video-showcase';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Hero({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const generatorRef = useRef<HTMLDivElement | null>(null);

  const handleScrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id={section.id}
      className={cn(
        'relative min-h-screen overflow-hidden bg-slate-950 mt-16',
        className
      )}
    >
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />

        {/* Bottom mesh gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Announcement */}
      {section.announcement && (
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex justify-center">
            <Link
              href={section.announcement.url || ''}
              target={section.announcement.target || '_self'}
              className="group inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Zap className="size-3.5 text-yellow-500" />
              <span>{section.announcement.title}</span>
              <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-sm">
              <Sparkles className="size-3.5 text-purple-400" />
              <span className="text-purple-300 font-medium">AI Video Generator</span>
            </div>

            {/* Headline */}
            {section.title && (
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  {section.title}
                </span>
              </h1>
            )}

            {/* Description */}
            {section.description && (
              <p
                className="text-lg text-gray-400 sm:text-xl max-w-2xl mx-auto lg:mx-0"
                dangerouslySetInnerHTML={{ __html: section.description }}
              />
            )}

            {/* Buttons */}
            {section.buttons && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                {section.buttons.map((button, idx) => (
                  <Button
                    key={idx}
                    asChild
                    size="lg"
                    className={cn(
                      'h-12 px-6 rounded-lg font-medium transition-all',
                      idx === 0
                        ? 'bg-white text-slate-950 hover:bg-gray-100 shadow-lg shadow-white/10'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    )}
                  >
                    <Link href={button.url ?? ''} target={button.target ?? '_self'} className="flex items-center gap-2">
                      {button.icon && <span>{button.icon}</span>}
                      <span>{button.title}</span>
                      {idx === 0 && <ArrowRight className="size-4" />}
                    </Link>
                  </Button>
                ))}
              </div>
            )}

            {/* Trust indicators */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Video className="size-4" />
                <span>10K+ videos created</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <svg key={i} className="size-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span>4.9 rating</span>
              </div>
            </div>
          </div>

          {/* Right - Preview */}
          <div className="relative mx-auto lg:mx-0 max-w-2xl">
            {/* Glow behind */}
            <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-3xl rounded-full" />

            {/* Preview card */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 overflow-hidden shadow-2xl">
              {/* Video/Image area */}
              <div className="aspect-video relative bg-gradient-to-br from-slate-900 to-slate-800">
                {section.video?.src ? (
                  <video
                    src={section.video.src}
                    poster={section.video.poster}
                    autoPlay={section.video.autoplay ?? true}
                    loop={section.video.loop ?? true}
                    muted={section.video.muted ?? true}
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : section.image?.src ? (
                  <Image
                    src={section.image.src}
                    alt={section.image.alt || 'Preview'}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Video className="size-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">AI Video Generator</p>
                    </div>
                  </div>
                )}

                {/* Play button */}
                <button
                  onClick={handleScrollToGenerator}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="relative flex size-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all group-hover:scale-110 group-hover:bg-white/15">
                    <Play className="size-6 text-white fill-white ml-0.5" />
                  </div>
                </button>
              </div>

              {/* Bottom bar */}
              <div className="p-4 bg-gradient-to-t from-slate-950/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Sparkles className="size-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Start creating</p>
                      <p className="text-xs text-gray-400">Free to try</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleScrollToGenerator}
                    className="h-9 bg-white text-slate-950 hover:bg-gray-100 font-medium"
                  >
                    Try Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo cloud */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">Trusted by leading companies</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Framer'].map((company, idx) => (
              <span key={idx} className="text-sm font-semibold text-gray-500">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Video Generator */}
      <div ref={generatorRef} id="wan-generator" className="relative z-10 mx-auto max-w-7xl px-4 pb-20">
        <WanVideoGeneratorInline />
      </div>

      {/* Video Showcase */}
      <VideoShowcase />
    </section>
  );
}
