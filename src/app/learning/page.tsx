import { getLearningDashboardData } from '@/app/actions/learning';
import LearningClient from './LearningClient-new';

export default async function LearningPage() {
  const data = await getLearningDashboardData();
  
  // Transform recentLogs for the new client - filter out nulls first
  const recentActivity = data.recentLogs
    .filter((log): log is NonNullable<typeof log> => log !== null)
    .map((log) => ({
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
