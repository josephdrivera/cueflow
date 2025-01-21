"use client"

import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface DuplicateCueAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  cueNumber: string;
}

export function DuplicateCueAlert({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  cueNumber
}: DuplicateCueAlertProps) {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <AlertDialog.Title className="text-lg font-semibold mb-2">
            Duplicate Cue Number
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
            Cue number {cueNumber} is already in use. Would you like to update the existing cue or delete it?
          </AlertDialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
            >
              Delete Existing
            </button>
            <button
              onClick={onUpdate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Update Existing
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
