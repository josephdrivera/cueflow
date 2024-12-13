"use client"

import { useSettings } from "@/contexts/SettingsContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* Display Settings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Display</h2>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="show-borders" className="font-medium">
                    Show Table Borders
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display vertical lines between columns in the cue sheet
                  </p>
                </div>
                <button
                  id="show-borders"
                  onClick={() => updateSettings({ showBorders: !settings.showBorders })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.showBorders ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showBorders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Add more sections here as needed */}
        </div>
      </div>
    </div>
  );
}
