import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  title: string;
  icon: React.ReactNode;
  onExport: () => void;
  isLoading: boolean;
  children: React.ReactElement; // Changed from React.ReactNode to React.ReactElement
  height?: number;
}

const renderLoading = () => (
  <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, icon, onExport, isLoading, children, height = 400 }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">{icon}{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onExport}><Download className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="relative">
        {isLoading && renderLoading()}
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};