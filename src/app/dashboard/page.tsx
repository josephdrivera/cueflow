import React from 'react';
import MainContainer from '@/components/MainContainer';

export default function DashboardPage() {
  return (
    <MainContainer>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6">
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        </div>
      </div>
    </MainContainer>
  );
}
