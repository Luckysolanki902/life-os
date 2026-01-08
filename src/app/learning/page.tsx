import { getLearningDashboardData } from '@/app/actions/learning';
import LearningClient from './LearningClient-new';

export default async function LearningPage() {
  const data = await getLearningDashboardData();
  
  // Transform recentLogs for the new client
  const recentActivity = data.recentLogs.map((log: {
    _id: string;
    date: Date;
    duration: number;
    activities?: string;
    difficulty?: string;
    notes?: string;
    rating?: number;
    medium: { title: string; icon?: string };
    area: { title: string; color?: string };
  }) => ({
    _id: log._id,
    date: log.date,
    duration: log.duration,
    activities: log.activities,
    difficulty: log.difficulty,
    notes: log.notes,
    rating: log.rating,
    mediumTitle: log.medium.title,
    mediumIcon: log.medium.icon,
    areaTitle: log.area.title,
    areaColor: log.area.color
  }));
  
  return (
    <LearningClient 
      areas={data.areas} 
      recentActivity={recentActivity}
      routine={data.routine}
    />
  );
}
