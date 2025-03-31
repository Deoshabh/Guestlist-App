import React from 'react';
import { useGuests } from '../contexts/GuestContext';

const GuestStatsCards = () => {
  const { stats } = useGuests();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4 stats-section">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Guests
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500 dark:text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Invited
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.invited}
          </p>
        </div>
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-500 dark:text-green-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Pending
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-500 dark:text-yellow-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GuestStatsCards;
