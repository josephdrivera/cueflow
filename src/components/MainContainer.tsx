import React from 'react';

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MainContainer: React.FC<MainContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${className}`}>
      {children}
    </div>
  );
};

export default MainContainer;
