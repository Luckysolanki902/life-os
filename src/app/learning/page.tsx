import { getLearningDashboardData } from '@/app/actions/learning';
import LearningClient from './LearningClient';

export default async function LearningPage() {
  const data = await getLearningDashboardData();
  
  return <LearningClient initialData={data} />;
}
