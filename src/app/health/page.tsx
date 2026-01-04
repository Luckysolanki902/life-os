import { getHealthDashboardData } from '@/app/actions/health';
import HealthClient from './HealthClient';

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const data = await getHealthDashboardData(date);

  return <HealthClient initialData={data} />;
}
