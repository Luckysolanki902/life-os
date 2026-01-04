import { getSocialDashboardData } from '@/app/actions/social';
import SocialClient from './SocialClient';

export default async function SocialPage() {
  const data = await getSocialDashboardData();
  
  return <SocialClient initialData={data} />;
}
