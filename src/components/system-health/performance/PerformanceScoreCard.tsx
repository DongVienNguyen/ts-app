import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, TrendingDown, Clock, Zap, Target } from 'lucide-react';
import { PerformanceInsights } from './types';

interface PerformanceScoreCardProps {
  insights: PerformanceInsights;
}

export const PerformanceScoreCard: React.FC<PerformanceScoreCardProps> = ({ insights }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return TrendingDown;
  };

  const ScoreIcon = getScoreIcon(insights.performanceScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <ScoreIcon className={`h-6 w-6 ${getScoreColor(insights.performanceScore).split(' ')[0]}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {insights.performanceScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Performance Score</div>
            <Badge className={`mt-2 ${getScoreColor(insights.performanceScore)}`}>
              {insights.performanceScore >= 80 ? 'Excellent' : 
               insights.performanceScore >= 60 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {insights.averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-green-700">Avg Response Time</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border">
            <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {insights.peakThroughput.toFixed(0)}
            </div>
            <div className="text-sm text-purple-700">Peak Throughput</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border">
            <Target className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">
              {insights.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm text-red-700">Error Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};