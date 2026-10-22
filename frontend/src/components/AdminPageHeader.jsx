import React from 'react';
import { LayoutGrid } from 'lucide-react';

const AdminPageHeader = ({
  icon: Icon = LayoutGrid,
  title,
  description,
  actions,
  meta,
  className = '',
  children
}) => {
  const renderIcon = () => {
    if (!Icon) return <LayoutGrid className="w-5 h-5 text-brand-red" />;
    if (React.isValidElement(Icon)) return Icon;
    const Component = Icon;
    return <Component className="w-5 h-5 text-brand-red" />;
  };

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon, Title & Description (No card outline, seamless) */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-brand-red flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
                {description}
              </p>
            )}
            {meta && <div className="mt-1">{meta}</div>}
          </div>
        </div>

        {/* Right: Action Buttons */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
