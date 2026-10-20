"use client";
/* Provider GIFs can use rotating CDN hosts; render the original media without Next's optimizer. */
/* eslint-disable @next/next/no-img-element */
import { Dumbbell } from "lucide-react";
import { useState } from "react";
export function ExerciseImage({
  src,
  name,
  className = "",
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src)
    return (
      <div className={`exercise-image image-fallback ${className}`} role="img" aria-label={name}>
        <Dumbbell size={34} />
      </div>
    );
  return (
    <img
      className={`exercise-image ${className}`}
      src={src}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
