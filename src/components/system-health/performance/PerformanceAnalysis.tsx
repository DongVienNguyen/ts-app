import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { PerformanceMetric, PerformanceInsights } from './types';

interface PerformanceAnalysisProps {
  metrics: PerformanceMetric[];
  insights: PerformanceInsights;
}

export const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ metrics, insights }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Identified Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.bottlenecks.length > 0 ? (
              <div className="space-y-3">
                {insights.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm font-medium text-orange-900">{bottleneck}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No performance bottlenecks detected</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.recommendations.length > 0 ? (
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">{recommendation}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>System is performing optimally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Correlation Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={metrics}>
              <CartesianGrid />
              <XAxis dataKey="responseTime" name="Response Time" unit="ms" />
              <YAxis dataKey="throughput" name="Throughput" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Performance Points" data={metrics} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};