import { getOverallReport } from '../actions/reports';
import ReportsClient from './ReportsClient';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'thisWeek';
  const data = await getOverallReport(period);

  return <ReportsClient initialData={data} initialPeriod={period} />;
}
