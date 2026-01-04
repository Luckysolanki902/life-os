import { getHealthReport } from '../../actions/reports';
import HealthReportClient from './HealthReportClient';

export default async function HealthReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'thisWeek';
  const data = await getHealthReport(period);

  return <HealthReportClient initialData={data} initialPeriod={period} />;
}
