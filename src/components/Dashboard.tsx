import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { BarChart, DonutChart, LineChart } from '@tremor/react';
import { BarChartIcon, PieChartIcon, TrendingUpIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { DashboardProps, DashboardMetrics, Suggestion } from '../types/index';

// Type for dashboard tabs
type DashboardTab = 'summary' | 'suggestions' | 'users' | 'trends';

const Dashboard: React.FC<DashboardProps> = ({ isAdmin, onBack }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('summary');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardMetrics(isAdmin);
        setMetrics(data);
      } catch (error: any) {
        console.error('Error fetching metrics:', error);
        setError('Failed to load metrics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchMetrics();
    } else {
      setError('You need administrator privileges to view this dashboard.');
      setLoading(false);
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to suggestions
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to suggestions
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to suggestions
          </button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-6 rounded-md">
          <p>No metrics data available.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'Pending': '#FBBF24',
    'In Progress': '#3B82F6',
    'Implemented': '#10B981',
    'Declined': '#EF4444',
    'Merged': '#8B5CF6'
  };

  const statusData = Object.entries(metrics.statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    color: statusColors[status] || '#6B7280'
  }));

  const departmentData = Object.entries(metrics.departmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dept, count]) => ({
      department: dept,
      count: count
    }));

  const implementationByDepartmentData = Object.entries(metrics.implementationByDepartment)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .map(([dept, data]) => ({
      department: dept,
      percentage: Math.round(data.percentage)
    }));

  const trendData = Object.entries(metrics.creationTrend)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({
      date: date,
      "New Suggestions": count
    }));

  const heatmapData: { day: string; hour: string; value: number }[] = [];
  Object.entries(metrics.activityHeatmap).forEach(([timeKey, count]) => {
    const [day, hour] = timeKey.split('-');
    heatmapData.push({
      day,
      hour,
      value: count
    });
  });

  const renderSummaryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Suggestions</div>
          <div className="mt-2 text-3xl font-bold">{metrics.totalSuggestions}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Comments</div>
          <div className="mt-2 text-3xl font-bold">{metrics.totalComments}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Votes</div>
          <div className="mt-2 text-3xl font-bold">{metrics.totalVotes}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Implementation Rate</div>
          <div className="mt-2 text-3xl font-bold">{Math.round(metrics.implementationRate)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Suggestion Status</h3>
          <DonutChart
            data={statusData}
            category="value"
            index="name"
            valueFormatter={(value) => `${value} suggestions`}
            colors={statusData.map(d => d.color)}
            className="h-60"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Suggestions by Department</h3>
          <BarChart
            data={departmentData}
            index="department"
            categories={["count"]}
            colors={["indigo"]}
            valueFormatter={(value) => `${value} suggestions`}
            yAxisWidth={48}
            className="h-60"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Trend Over Time</h3>
        <LineChart
          data={trendData}
          index="date"
          categories={["New Suggestions"]}
          colors={["indigo"]}
          valueFormatter={(value) => `${value}`}
          yAxisWidth={40}
          className="h-60"
        />
      </div>
    </div>
  );

  const renderSuggestionsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Implementation Rate by Department</h3>
          <BarChart
            data={implementationByDepartmentData}
            index="department"
            categories={["percentage"]}
            colors={["emerald"]}
            valueFormatter={(value) => `${value}%`}
            yAxisWidth={48}
            className="h-60"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Anonymous vs. Named Suggestions</h3>
          <DonutChart
            data={[
              { name: 'Anonymous', value: metrics.anonymousPercentage, color: '#6366F1' },
              { name: 'Named', value: 100 - metrics.anonymousPercentage, color: '#22D3EE' }
            ]}
            category="value"
            index="name"
            valueFormatter={(value) => `${value}%`}
            className="h-60"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Pending High Priority Suggestions</h3>
        {metrics.pendingHighPriority.length > 0 ? (
          <div className="divide-y">
            {metrics.pendingHighPriority.map((suggestion: Suggestion) => (
              <div key={suggestion.id} className="py-3">
                <div className="font-medium">{suggestion.title}</div>
                <div className="flex items-center text-sm mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800`}>
                    {suggestion.status}
                  </span>
                  <span className="ml-2 text-gray-500">
                    Priority: {suggestion.priorityScore}
                  </span>
                  <span className="ml-2 text-gray-500">
                    Votes: {suggestion.votes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No high priority suggestions pending.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Top Voted Suggestions</h3>
          {metrics.topVotedSuggestions.length > 0 ? (
            <div className="divide-y">
              {metrics.topVotedSuggestions.map((suggestion: Suggestion) => (
                <div key={suggestion.id} className="py-3">
                  <div className="font-medium">{suggestion.title}</div>
                  <div className="flex items-center text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      {suggestion.votes} votes
                    </span>
                    <span className="ml-2 text-gray-500">
                      Status: {suggestion.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No voted suggestions yet.</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Most Discussed Suggestions</h3>
          {metrics.topCommentedSuggestions.length > 0 ? (
            <div className="divide-y">
              {metrics.topCommentedSuggestions.map((suggestion: Suggestion) => (
                <div key={suggestion.id} className="py-3">
                  <div className="font-medium">{suggestion.title}</div>
                  <div className="flex items-center text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                      {suggestion.comments.length} comments
                    </span>
                    <span className="ml-2 text-gray-500">
                      Status: {suggestion.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No commented suggestions yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Activity Heatmap</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Simple visualization of heatmap since Tremor doesn't have a heatmap component */}
            <div className="grid grid-cols-8 gap-1">
              <div className="text-center"></div>
              {Array.from({ length: 7 }, (_, i) => 
                <div key={i} className="text-center text-xs font-medium text-gray-500">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                </div>
              )}
              
              {Array.from({ length: 24 }, (_, hour) => (
                <React.Fragment key={hour}>
                  <div className="text-right text-xs text-gray-500 pr-2">
                    {hour}:00
                  </div>
                  {Array.from({ length: 7 }, (_, day) => {
                    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
                    const value = heatmapData.find(d => d.day === dayName && parseInt(d.hour) === hour)?.value || 0;
                    const intensity = Math.min(value / 10, 1); // Scale intensity, max at 10+ activities
                    return (
                      <div 
                        key={`${day}-${hour}`} 
                        className="h-6 rounded"
                        style={{ 
                          backgroundColor: `rgba(79, 70, 229, ${intensity})`,
                          opacity: value > 0 ? 1 : 0.1
                        }}
                        title={`${dayName} ${hour}:00 - ${value} activities`}
                      ></div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">User Activity Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium mb-2">Average Time to Implementation</h4>
            <p className="text-2xl font-bold">
              {metrics.averageTimeToImplementation > 0 
                ? `${metrics.averageTimeToImplementation.toFixed(1)} days` 
                : 'No data'}
            </p>
          </div>
          <div>
            <h4 className="text-md font-medium mb-2">Weekly Creation Average</h4>
            <p className="text-2xl font-bold">
              {metrics.weeklyCreationAverage.toFixed(1)} suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Activity Over Time</h3>
        <LineChart
          data={trendData}
          index="date"
          categories={["New Suggestions"]}
          colors={["indigo"]}
          valueFormatter={(value) => `${value}`}
          yAxisWidth={40}
          className="h-72"
        />
        <p className="mt-4 text-sm text-gray-500">
          This chart shows the volume of new suggestions over time. It helps identify trends in user engagement.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to suggestions
        </button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('summary')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'summary'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm flex items-center`}
            >
              <BarChartIcon size={16} className="mr-2" />
              Summary
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'suggestions'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm flex items-center`}
            >
              <PieChartIcon size={16} className="mr-2" />
              Suggestions
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm flex items-center`}
            >
              <UsersIcon size={16} className="mr-2" />
              User Activity
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'trends'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm flex items-center`}
            >
              <TrendingUpIcon size={16} className="mr-2" />
              Trends
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'summary' && renderSummaryTab()}
      {activeTab === 'suggestions' && renderSuggestionsTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'trends' && renderTrendsTab()}
    </div>
  );
};

export default Dashboard; 