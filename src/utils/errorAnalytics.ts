import { SystemError } from '@/types/system';

export function getErrorStatistics(errors: SystemError[]) {
  const byType: { [key: string]: number } = {};
  const bySeverity: { [key: string]: number } = {};
  const byBrowser: { [key: string]: number } = {};
  const byOS: { [key: string]: number } = {};
  const errorTrend: { date: string; count: number }[] = [];

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    errorTrend.push({ date: date.toISOString().split('T')[0], count: 0 });
  }

  errors.forEach(error => {
    byType[error.error_type] = (byType[error.error_type] || 0) + 1;
    bySeverity[error.severity || 'medium'] = (bySeverity[error.severity || 'medium'] || 0) + 1;

    let browser = 'Unknown';
    let os = 'Unknown';

    if (error.user_agent && typeof error.user_agent === 'string' && error.user_agent.trim() !== '' && error.user_agent.toLowerCase() !== 'null') {
      const ua = error.user_agent.toLowerCase();
      if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
      else if (ua.includes('edge')) browser = 'Edge';
      else if (ua.includes('opera')) browser = 'Opera';

      if (ua.includes('windows')) os = 'Windows';
      else if (ua.includes('mac os')) os = 'macOS';
      else if (ua.includes('linux')) os = 'Linux';
      else if (ua.includes('android')) os = 'Android';
      else if (ua.includes('ios')) os = 'iOS';
    }
    
    byBrowser[browser] = (byBrowser[browser] || 0) + 1;
    byOS[os] = (byOS[os] || 0) + 1;

    if (error.created_at) {
      const errorDate = new Date(error.created_at).toISOString().split('T')[0];
      const trendEntry = errorTrend.find(entry => entry.date === errorDate);
      if (trendEntry) trendEntry.count++;
    }
  });

  const totalErrors = errors.length;
  const criticalErrors = bySeverity['critical'] || 0;
  const resolvedErrors = errors.filter(e => e.status === 'resolved').length;
  const errorRate = totalErrors > 0 ? (criticalErrors / totalErrors) * 100 : 0;

  const topErrorTypes = Object.entries(byType)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return { totalErrors, criticalErrors, resolvedErrors, errorRate, topErrorTypes, errorTrend, byType, bySeverity, byBrowser, byOS, recent: errors.slice(0, 10) };
}

export const getStatusColor = (status: string) => {
  if (status === 'online') return 'text-green-600 bg-green-100';
  if (status === 'degraded') return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export const getSeverityColor = (severity: string | undefined) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};