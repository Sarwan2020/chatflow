import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600 dark:text-blue-400 ${sizeClasses[size]} ${className}`}
    />
  );
};

interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message,
  size = 'medium',
}) => {
  return (
    <div className="flex items-center gap-2">
      <Spinner size={size} />
      {message && (
        <span className="text-gray-600 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
};

export const MessageSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const ConversationSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-2 p-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
};

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  size?: 'small' | 'medium' | 'large';
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({ size = 'small' }) => {
  return <Spinner size={size} className="mr-2" />;
};

// Default export for backward compatibility
const Loading: React.FC<{ variant?: 'spinner' | 'fullPage' | 'inline' | 'skeleton' }> = ({
  variant = 'spinner',
}) => {
  switch (variant) {
    case 'fullPage':
      return <FullPageLoading />;
    case 'inline':
      return <InlineLoading />;
    case 'skeleton':
      return <MessageSkeleton />;
    case 'spinner':
    default:
      return <Spinner />;
  }
};

export default Loading;
