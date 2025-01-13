"use client"

import { useSettings } from "@/contexts/SettingsContext";
import { ArrowLeft, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

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
          {/* Theme Settings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Theme</h2>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Sun className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Moon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    theme === 'system'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Monitor className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Choose your preferred theme or sync with your system settings.
              </p>
            </div>
          </section>

          {/* Font Size Settings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Font Size</h2>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => updateSettings({ fontSize: 'small' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    settings.fontSize === 'small'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Small</span>
                </button>
                <button
                  onClick={() => updateSettings({ fontSize: 'medium' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    settings.fontSize === 'medium'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Medium</span>
                </button>
                <button
                  onClick={() => updateSettings({ fontSize: 'large' })}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    settings.fontSize === 'large'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Large</span>
                </button>
              </div>
            </div>
          </section>

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

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label htmlFor="show-search" className="font-medium">
                    Show Search Bar
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display search bar for filtering cues
                  </p>
                </div>
                <button
                  id="show-search"
                  onClick={() => updateSettings({ showSearch: !settings.showSearch })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.showSearch ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showSearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Show Stats Settings */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Statistics</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display total cues, running time, and current time at the bottom of the cue sheet
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showStats: !settings.showStats })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showStats ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showStats ? 'translate-x-6' : 'translate-x-1'
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
