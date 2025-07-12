import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleSummary {
  [role: string]: number;
}

export function UserRoleSummaryCard() {
  const [summary, setSummary] = useState<RoleSummary>({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      const { data, error, count } = await supabase.from('staff').select('role', { count: 'exact' });
      
      if (error) {
        console.error("Error fetching user roles:", error);
      } else if (data) {
        const roleCounts = data.reduce((acc, user) => {
          const role = user.role || 'user';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as RoleSummary);
        setSummary(roleCounts);
        setTotalUsers(count || 0);
      }
      setIsLoading(false);
    };
    fetchRoles();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Phân loại vai trò người dùng</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mt-4 pt-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Phân loại vai trò người dùng</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalUsers}</div>
        <p className="text-xs text-muted-foreground">Tổng số người dùng</p>
        <div className="mt-4 space-y-2">
          {Object.entries(summary).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{role}</span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}