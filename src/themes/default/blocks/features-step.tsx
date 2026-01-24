'use client';

import { ArrowBigRight } from 'lucide-react';

import { SmartIcon } from '@/shared/blocks/common';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function FeaturesStep({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="m-4 rounded-[2rem]">
        <div className="@container relative container">
          <ScrollAnimation>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-primary">{section.label}</span>
              <h2 className="text-foreground mt-4 text-4xl font-semibold">
                {section.title}
              </h2>
              <p className="text-muted-foreground mt-4 text-lg text-balance">
                {section.description}
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation delay={0.2}>
            <div className="mx-auto mt-20 grid max-w-5xl gap-8 md:grid-cols-3 @3xl:grid-cols-4">
              {section.items?.map((item, idx) => (
                  <div className="flex flex-col items-center space-y-4 text-center" key={idx}>
                    <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="relative">
                      <div className="flex size-16 items-center justify-center">
                        {item.icon && (
                          <SmartIcon name={item.icon as string} size={32} />
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-col items-center space-y-2 px-2">
                      <h3 className="text-foreground text-center text-base font-semibold leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-center text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
