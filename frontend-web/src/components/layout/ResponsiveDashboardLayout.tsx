import React from 'react';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const headingId = React.useId();
  const mainId = React.useId();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-10" role="banner">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                id={headingId}
                className="text-lg font-bold text-gray-900"
                tabIndex={0}
              >
                {title}
              </h1>
              {subtitle && (
                <p 
                  className="text-sm text-gray-600 mt-1"
                  aria-describedby={headingId}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div 
                className="flex-shrink-0"
                role="group"
                aria-label="Ações do dashboard"
              >
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block" role="banner">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-2xl font-bold text-gray-900"
                tabIndex={0}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div 
                className="flex items-center space-x-4"
                role="group"
                aria-label="Ações do dashboard"
              >
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main 
        id={mainId}
        className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        role="main"
        aria-labelledby={headingId}
      >
        {children}
      </main>
    </div>
  );
};
