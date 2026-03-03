'use client';

import { EntryForm } from '@/components/daily-entry/entry-form';

export default function NewDailyEntryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Daily Entry</h1>
        <p className="text-gray-600 mt-1">Create a new cashbook entry</p>
      </div>
      <EntryForm />
    </div>
  );
}
