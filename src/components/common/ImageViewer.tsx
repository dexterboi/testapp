import React, { useEffect, useState } from 'react';
import { getFileUrl } from '@/services/supabase';

interface ImageViewerProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  collectionName: string;
  recordId: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  images,
  currentIndex,
  collectionName,
  recordId,
  onClose,
  onNext,
  onPrevious
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      onPrevious();
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const getBucketName = () => {
    if (collectionName === 'complexes' || collectionName === 'complexes_coll') return 'complex-images';
    if (collectionName === 'pitches' || collectionName === 'pitches_coll') return 'pitch-images';
    return 'uploads';
  };

  const imageUrl = currentImage.startsWith('http')
    ? currentImage
    : getFileUrl(getBucketName(), `${recordId}/${currentImage}`);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center font-sans animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Gallery</span>
          <h3 className="text-white font-black text-sm uppercase tracking-tighter">
            {images.length > 1 ? `Shot ${currentIndex + 1} of ${images.length}` : 'Legacy View'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-14 h-14 flex items-center justify-center bg-app-surface-2 hover:bg-white/20 text-white rounded-[1.5rem] transition-all active:scale-90 border border-app-border shadow-lg backdrop-blur-md"
        >
          <span className="material-symbols-rounded text-3xl">close</span>
        </button>
      </div>

      {/* Main Navigation */}
      <div className="absolute inset-0 flex items-center justify-between p-6 pointer-events-none">
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              disabled={currentIndex === 0}
              className={`w-16 h-16 flex items-center justify-center bg-app-surface-2 text-white rounded-[2rem] transition-all border border-app-border backdrop-blur-sm pointer-events-auto ${currentIndex === 0 ? 'opacity-0 scale-90' : 'hover:bg-app-surface-2 hover:scale-110 active:scale-90 shadow-2xl'}`}
            >
              <span className="material-symbols-rounded text-3xl">arrow_back_ios_new</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              disabled={currentIndex === images.length - 1}
              className={`w-16 h-16 flex items-center justify-center bg-app-surface-2 text-white rounded-[2rem] transition-all border border-app-border backdrop-blur-sm pointer-events-auto ${currentIndex === images.length - 1 ? 'opacity-0 scale-90' : 'hover:bg-app-surface-2 hover:scale-110 active:scale-90 shadow-2xl'}`}
            >
              <span className="material-symbols-rounded text-3xl">arrow_forward_ios</span>
            </button>
          </>
        )}
      </div>

      {/* Image Container */}
      <div
        className="w-full h-full flex items-center justify-center p-8 active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClose}
      >
        <div className="relative group max-w-6xl w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={imageUrl}
            alt="Venue Shot"
            className="max-w-full max-h-full object-contain rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] select-none animate-in zoom-in-95 duration-500 ease-out"
            draggable={false}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-4 z-50 pointer-events-none">
        {images.length > 1 && (
          <div className="px-6 py-3 bg-app-surface-2 backdrop-blur-xl border border-app-border rounded-full flex gap-3 shadow-2xl pointer-events-auto">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-8 bg-primary' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-[0.3em] bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
          <span className="material-symbols-rounded text-xs">swipe</span>
          Swipe to explore
        </div>
      </div>
    </div>
  );
};
