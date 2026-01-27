'use client';

import { useEffect, useState } from 'react';
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

export default function HomePageClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/home');
        const result = await response.json();
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
      <div className="space-y-6 pb-24 animate-pulse">
        {/* Hero Skeleton */}
        <div className="relative py-10 md:py-16 text-center space-y-3 rounded-3xl bg-card/50 border border-border/30">
          <div className="h-12 w-3/4 mx-auto bg-muted/50 rounded-lg" />
          <div className="h-8 w-1/2 mx-auto bg-muted/30 rounded-lg" />
          <div className="h-10 w-48 mx-auto bg-muted/40 rounded-full" />
        </div>

        {/* Streaks Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card/50 border border-border/30 rounded-2xl" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-64 bg-card/50 border border-border/30 rounded-2xl" />

        {/* Domain Cards Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card/50 border border-border/30 rounded-2xl" />
          ))}
        </div>

        {/* Loading text */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96 text-muted-foreground">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <section className="relative py-10 md:py-16 text-center space-y-3 overflow-hidden rounded-3xl glass border-none shadow-sm">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />

        <h1 className="relative text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          You are <span className="text-primary">{Math.floor(data.totalPoints / 100)}%</span> better
          <br />
          <span className="text-xl md:text-2xl font-normal text-muted-foreground mt-2 block">
            version of yourself
          </span>
        </h1>

        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
          <span>Total Points: {data.totalPoints.toLocaleString()}</span>
        </div>
      </section>

      <NewHomeClient
        incompleteTasks={data.incompleteTasks}
        domains={data.domains}
        todaysWeight={data.todaysWeight}
        streakData={data.streakData}
        specialTasks={data.specialTasks}
        totalPoints={data.totalPoints}
        last7DaysCompletion={data.last7DaysCompletion}
      />
    </div>
  );
}
