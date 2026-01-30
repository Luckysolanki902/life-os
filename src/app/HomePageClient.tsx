'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import NewHomeClient from './NewHomeClient';
import { useReactiveCache, setCache, CACHE_KEYS } from '@/lib/reactive-cache';

interface HomeData {
  incompleteTasks: any[];
  domains: any[];
  todaysWeight: any;
  streakData: any;
  specialTasks: any[];
  totalPoints: number;
  last7DaysCompletion: any[];
}

async function fetchHomeData(): Promise<HomeData> {
  const response = await fetch('/api/home', { cache: 'no-store' });
  return response.json();
}

export default function HomePageClient() {
  const hasFetched = useRef(false);
  
  // Use reactive cache - automatically syncs when cache updates
  const { data, isLoading } = useReactiveCache<HomeData>(
    CACHE_KEYS.HOME_DATA,
    fetchHomeData
  );

  // Also fetch fresh data on mount (background refresh)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Background refresh - don't block UI
    fetchHomeData()
      .then((result) => {
        setCache(CACHE_KEYS.HOME_DATA, result);
      })
      .catch(console.error);
  }, []);

  // Show minimal loading only if no cached data
  if (isLoading && !data) {
    return (
      <div className="space-y-4 pt-4 px-1">
        {/* Minimal skeleton for truly first load */}
        <div className="flex justify-between items-center mb-6">
           <div className="space-y-2">
              <div className="h-6 w-32 bg-secondary/50 rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-secondary/30 rounded-lg animate-pulse" />
           </div>
           <div className="h-8 w-16 bg-secondary/50 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
           <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-6 w-24 bg-secondary/30 rounded-lg mb-2 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card border border-border/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground flex-col gap-2">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Pass everything to the new client which handles the full layout
  return (
    <NewHomeClient
      incompleteTasks={data.incompleteTasks}
      domains={data.domains}
      todaysWeight={data.todaysWeight}
      streakData={data.streakData}
      specialTasks={data.specialTasks}
      totalPoints={data.totalPoints}
      last7DaysCompletion={data.last7DaysCompletion}
    />
  );
}
