/**
 * ImageRenderer component for displaying images in chat messages.
 * 
 * Features:
 * - Responsive image sizing
 * - Click to expand (lightbox)
 * - Loading placeholder
 * - Error fallback
 * - Alt text support
 * - Lazy loading
 */

import React, { useState } from 'react';

interface ImageRendererProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({
  src,
  alt = 'Image',
  caption,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openLightbox = () => {
    if (!hasError) {
      setIsLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  if (hasError) {
    return (
      <div className={`image-error ${className}`}>
        <div className="error-content">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Failed to load image</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className="error-link">
            Open in new tab
          </a>
        </div>
        <style>{`
          .image-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            background: #f3f4f6;
            border-radius: 0.5rem;
            border: 2px dashed #d1d5db;
          }

          .error-content {
            text-align: center;
            color: #6b7280;
          }

          .error-icon {
            width: 3rem;
            height: 3rem;
            margin: 0 auto 0.5rem;
            color: #ef4444;
          }

          .error-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: #3b82f6;
            text-decoration: underline;
          }

          .error-link:hover {
            color: #2563eb;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className={`image-container ${className}`}>
        {isLoading && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          onClick={openLightbox}
          className={`image ${isLoading ? 'hidden' : ''}`}
        />
        
        {caption && !isLoading && (
          <div className="image-caption">{caption}</div>
        )}

        <style>{`
          .image-container {
            position: relative;
            margin: 1rem 0;
            border-radius: 0.5rem;
            overflow: hidden;
            background: #f9fafb;
          }

          .image-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: #6b7280;
          }

          .loading-spinner {
            width: 2rem;
            height: 2rem;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 0.5rem;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .image {
            width: 100%;
            height: auto;
            max-height: 500px;
            object-fit: contain;
            cursor: pointer;
            transition: transform 0.2s;
            display: block;
          }

          .image:hover {
            transform: scale(1.02);
          }

          .image.hidden {
            display: none;
          }

          .image-caption {
            padding: 0.75rem;
            background: #f3f4f6;
            color: #4b5563;
            font-size: 0.875rem;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
        `}</style>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={src} alt={alt} className="lightbox-image" />
            {caption && <div className="lightbox-caption">{caption}</div>}
          </div>

          <style>{`
            .lightbox {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.9);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              padding: 2rem;
              animation: fadeIn 0.2s;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            .lightbox-content {
              position: relative;
              max-width: 90vw;
              max-height: 90vh;
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            .lightbox-close {
              position: absolute;
              top: -3rem;
              right: 0;
              background: rgba(255, 255, 255, 0.1);
              border: none;
              color: white;
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s;
            }

            .lightbox-close:hover {
              background: rgba(255, 255, 255, 0.2);
            }

            .lightbox-close svg {
              width: 1.5rem;
              height: 1.5rem;
            }

            .lightbox-image {
              max-width: 100%;
              max-height: calc(90vh - 4rem);
              object-fit: contain;
              border-radius: 0.5rem;
            }

            .lightbox-caption {
              margin-top: 1rem;
              color: white;
              text-align: center;
              font-size: 0.875rem;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ImageRenderer;
