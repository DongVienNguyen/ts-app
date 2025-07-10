import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageHeader } from '@/components/usage/UsageHeader';
import { UsageOverviewCards } from '@/components/usage/UsageOverviewCards';
import { TrendsTab } from '@/components/usage/TrendsTab';
import { DevicesTab } from '@/components/usage/DevicesTab';
import { BrowsersTab } from '@/components/usage/BrowsersTab';
import { DetailedStatsTab } from '@/components/usage/DetailedStatsTab';
import { useUsageData } from '@/hooks/useUsageData';

export function UsageMonitoringDashboard() {
  const {
    usageOverview,
    deviceStats,
    browserStats,
    timeRangeData,
    selectedTimeRange,
    isLoading,
    lastUpdated,
    setSelectedTimeRange,
    loadUsageData,
    formatDuration
  } = useUsageData();

  return (
    <div className="space-y-6">
      <UsageHeader
        selectedTimeRange={selectedTimeRange}
        lastUpdated={lastUpdated}
        onTimeRangeChange={setSelectedTimeRange}
        onRefresh={loadUsageData}
      />

      <UsageOverviewCards
        overview={usageOverview}
        formatDuration={formatDuration}
      />

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
          <TabsTrigger value="browsers">Trình duyệt</TabsTrigger>
          <TabsTrigger value="detailed">Chi tiết</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <TrendsTab timeRangeData={timeRangeData} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DevicesTab 
            deviceStats={deviceStats} 
            totalSessions={usageOverview.totalSessions} 
          />
        </TabsContent>

        <TabsContent value="browsers" className="space-y-4">
          <BrowsersTab browserStats={browserStats} />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <DetailedStatsTab
            overview={usageOverview}
            formatDuration={formatDuration}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}