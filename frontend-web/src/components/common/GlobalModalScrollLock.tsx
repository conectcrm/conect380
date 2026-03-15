import React, { useEffect } from 'react';

const MODAL_QUERY = ['[role="dialog"][aria-modal="true"]', '[aria-modal="true"]', '.modal-content']
  .join(', ');

const OVERLAY_FALLBACK_QUERY = '.fixed.inset-0';
const LOCK_CLASS = 'modal-scroll-lock';
const LOCK_PADDING_VAR = '--modal-scroll-lock-padding-right';

const isVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const isLikelyModalOverlay = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  if (style.position !== 'fixed') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const coversViewport =
    rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.75;
  const zIndex = Number.parseInt(style.zIndex || '0', 10);
  const hasBackdrop = style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.backdropFilter !== 'none';

  return coversViewport && zIndex >= 40 && hasBackdrop;
};

const hasOpenModal = (): boolean => {
  const modalNodes = Array.from(document.querySelectorAll<HTMLElement>(MODAL_QUERY));
  if (modalNodes.some((node) => isVisible(node))) {
    return true;
  }

  const overlayNodes = Array.from(document.querySelectorAll<HTMLElement>(OVERLAY_FALLBACK_QUERY));
  return overlayNodes.some((node) => isVisible(node) && isLikelyModalOverlay(node));
};

const applyScrollLock = (): void => {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) {
    return;
  }

  if (html.classList.contains(LOCK_CLASS) && body.classList.contains(LOCK_CLASS)) {
    return;
  }

  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
  html.style.setProperty(LOCK_PADDING_VAR, `${scrollbarWidth}px`);
  body.style.setProperty(LOCK_PADDING_VAR, `${scrollbarWidth}px`);

  html.classList.add(LOCK_CLASS);
  body.classList.add(LOCK_CLASS);
};

const removeScrollLock = (): void => {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) {
    return;
  }

  html.classList.remove(LOCK_CLASS);
  body.classList.remove(LOCK_CLASS);
  html.style.removeProperty(LOCK_PADDING_VAR);
  body.style.removeProperty(LOCK_PADDING_VAR);
};

const GlobalModalScrollLock: React.FC = () => {
  useEffect(() => {
    let frameId: number | null = null;

    const syncState = () => {
      frameId = null;
      if (hasOpenModal()) {
        applyScrollLock();
      } else {
        removeScrollLock();
      }
    };

    const scheduleSync = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(syncState);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-modal', 'role', 'open'],
    });

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('orientationchange', scheduleSync);

    scheduleSync();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('orientationchange', scheduleSync);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      removeScrollLock();
    };
  }, []);

  return null;
};

export default GlobalModalScrollLock;
