import { useEffect, useRef, useState, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useIntersectionObserver<T extends HTMLElement>(
  options: IntersectionObserverOptions = {},
  once: boolean = true
): { ref: RefObject<T>; entry: IntersectionObserverEntry | null; isIntersecting: boolean } {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<T | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && once && targetRef.current) {
        observerRef.current?.unobserve(targetRef.current);
      }
    }, options);

    const { current: observer } = observerRef;
    const { current: target } = targetRef;

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [options.root, options.rootMargin, options.threshold, once]);

  return { ref: targetRef, entry, isIntersecting };
}