import { DatabaseIcon, BarChart2, Settings, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TabGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs: Array<{
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabGroups: TabGroup[] = [
    {
      label: 'Quản lý chính',
      icon: DatabaseIcon,
      tabs: [
        { value: 'management', label: 'Quản lý dữ liệu', icon: DatabaseIcon },
        { value: 'statistics', label: 'Thống kê', icon: BarChart2 },
        // { value: 'admin-settings', label: 'Cài đặt Admin', icon: Settings }, // Removed this line
      ]
    }
  ];

  return (
    <div className="w-full">
      {/* Desktop Tabs */}
      <div className="hidden lg:block">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2"> {/* Changed grid-cols to 2 */}
            {tabGroups.flatMap(group => group.tabs).map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="mr-2 h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Dropdown */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {tabGroups.map((group) => (
            <Card key={group.label}>
              <CardHeader className="pb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <group.icon className="w-4 h-4" />
                        <span>{group.label}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {group.tabs.map((tab) => (
                      <DropdownMenuItem 
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={activeTab === tab.value ? 'bg-blue-50' : ''}
                      >
                        <tab.icon className="mr-2 h-4 w-4" />
                        {tab.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};