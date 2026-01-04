import { getSocialReport } from '../../actions/reports';
import SocialReportClient from './SocialReportClient';

export default async function SocialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; relationId?: string; personId?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || 'thisWeek';
  const relationId = params.relationId || undefined;
  const personId = params.personId || undefined;
  
  const data = await getSocialReport(period, relationId, personId);

  return (
    <SocialReportClient 
      initialData={data} 
      initialPeriod={period}
      initialRelationId={relationId}
      initialPersonId={personId}
    />
  );
}
