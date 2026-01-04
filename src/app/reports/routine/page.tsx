import { getRoutineReport } from '../../actions/reports';
import RoutineReportClient from './RoutineReportClient';

export default async function RoutineReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'thisWeek';
  const data = await getRoutineReport(period);

  return <RoutineReportClient initialData={data} initialPeriod={period} />;
}
