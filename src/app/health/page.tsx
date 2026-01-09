import { getHealthDashboardData } from '@/app/actions/health';
import HealthClient from './HealthClient';

// Force dynamic rendering since date depends on current time
export const dynamic = 'force-dynamic';

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const data = await getHealthDashboardData(date);

  return <HealthClient initialData={data} />;
}
