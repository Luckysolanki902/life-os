'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import NewHomeClient from './NewHomeClient';

interface HomeData {
  incompleteTasks: any[];
  domains: any[];
  todaysWeight: any;
  streakData: any;
  specialTasks: any[];
  totalPoints: number;
  last7DaysCompletion: any[];
}

// Simple in-memory cache with timestamp
let cachedData: { data: HomeData; timestamp: number } | null = null;
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

// Export cache clearing function for use in actions
export function clearHomeCache() {
  cachedData = null;
}

export default function HomePageClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in dev mode strict mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchData() {
      try {
        // Check cache first
        const now = Date.now();
        if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
          setData(cachedData.data);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/home', {
          // Add cache headers for browser caching
          next: { revalidate: 180 }
        });
        const result = await response.json();
        
        // Update cache
        cachedData = { data: result, timestamp: now };
        setData(result);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 pt-4 px-1">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
           <div className="space-y-2">
              <div className="h-6 w-32 bg-secondary/50 rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-secondary/30 rounded-lg animate-pulse" />
           </div>
           <div className="h-8 w-16 bg-secondary/50 rounded-full animate-pulse" />
        </div>

        {/* Hero Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4">
           <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
           <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
        </div>

        {/* List Skeleton */}
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
