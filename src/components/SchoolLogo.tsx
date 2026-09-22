import React from 'react';

interface SchoolLogoProps {
  className?: string;
  imgClassName?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  badge?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  imgClassName = '',
  showText = false,
  size = 'md',
  badge = false,
}) => {
  const sizeMap: Record<string, string> = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    responsive: 'h-9 sm:h-11 md:h-12',
  };

  const imageElement = (
    <img
      src="/logo.png"
      alt="Tryškių Lazdynų Pelėdos gimnazija"
      className={`${imgClassName || sizeMap[size]} w-auto object-contain shrink-0 select-none`}
      loading="eager"
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );

  return (
    <div className={`inline-flex items-center space-x-3 shrink-0 ${className}`} id="school-logo-component">
      {badge ? (
        <div className="p-1.5 sm:p-2 bg-white rounded-xl border border-amber-200/90 shadow-xs ring-1 ring-amber-100/60 flex items-center justify-center shrink-0">
          {imageElement}
        </div>
      ) : (
        imageElement
      )}

      {showText && (
        <div className="flex flex-col text-left shrink-0">
          <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base uppercase leading-tight">
            Tryškių Lazdynų Pelėdos
          </span>
          <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
            Gimnazija
          </span>
        </div>
      )}
    </div>
  );
};

