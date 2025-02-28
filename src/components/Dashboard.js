import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { BarChart, PieChart, LineChart, PieSlice, BarItem, Line, Area } from '@tremor/react';
import { BarChartIcon, PieChartIcon, TrendingUpIcon, ClockIcon, UsersIcon } from 'lucide-react';

const Dashboard = ({ isAdmin, onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardMetrics(isAdmin);
        setMetrics(data);
      } catch (error) {
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
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Suggestions
          </button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading metrics...</p>
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
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Suggestions
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Format metrics for charts
  const statusChartData = metrics ? Object.entries(metrics.summary.statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  })) : [];

  const departmentChartData = metrics ? Object.entries(metrics.departments.byDepartment).map(([dept, count]) => ({
    name: dept,
    value: count
  })) : [];

  const trendChartData = metrics ? metrics.timeSeries.creationTrend.map(item => ({
    date: item.month,
    "New Suggestions": item.count
  })) : [];

  const activityByDayData = metrics ? metrics.timeSeries.activityHeatmap.byDay.map((count, index) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      day: days[index],
      Activities: count
    };
  }) : [];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Suggestions
        </button>
      </div>

      {/* Dashboard tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'summary' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('summary')}
        >
          <div className="flex items-center">
            <BarChartIcon size={16} className="mr-2" />
            Summary
          </div>
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'engagement' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('engagement')}
        >
          <div className="flex items-center">
            <UsersIcon size={16} className="mr-2" />
            Engagement
          </div>
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'departments' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('departments')}
        >
          <div className="flex items-center">
            <PieChartIcon size={16} className="mr-2" />
            Departments
          </div>
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'implementation' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('implementation')}
        >
          <div className="flex items-center">
            <ClockIcon size={16} className="mr-2" />
            Implementation
          </div>
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'trends' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('trends')}
        >
          <div className="flex items-center">
            <TrendingUpIcon size={16} className="mr-2" />
            Trends
          </div>
        </button>
      </div>

      {/* Dashboard content based on active tab */}
      {activeTab === 'summary' && metrics && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Total Suggestions</h3>
              <p className="text-3xl font-bold">{metrics.summary.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Active Suggestions</h3>
              <p className="text-3xl font-bold">{metrics.summary.active}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Average Per Week</h3>
              <p className="text-3xl font-bold">{metrics.summary.averagePerWeek.toFixed(1)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Implementation Rate</h3>
              <p className="text-3xl font-bold">{(metrics.implementation.implementationRate.rate * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Suggestions by Status</h3>
              <PieChart
                data={statusChartData}
                index="name"
                valueFormatter={(number) => `${number} suggestions`}
                category="value"
                className="h-80"
                colors={["indigo", "cyan", "amber", "emerald", "rose", "slate"]}
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Top Voted Suggestions</h3>
              <div className="overflow-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.engagement.topVoted.map((suggestion) => (
                      <tr key={suggestion.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{suggestion.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{suggestion.votes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${suggestion.status === 'Implemented' ? 'bg-green-100 text-green-800' : 
                              suggestion.status === 'Declined' ? 'bg-red-100 text-red-800' :
                              suggestion.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              suggestion.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {suggestion.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && metrics && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Total Comments</h3>
              <p className="text-3xl font-bold">{metrics.engagement.commentCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Named Suggestions</h3>
              <p className="text-3xl font-bold">{metrics.engagement.anonymousRatio.named}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Anonymous Suggestions</h3>
              <p className="text-3xl font-bold">{metrics.engagement.anonymousRatio.anonymous}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Anonymous vs. Named Ratio</h3>
              <PieChart
                data={[
                  { name: 'Named', value: metrics.engagement.anonymousRatio.named },
                  { name: 'Anonymous', value: metrics.engagement.anonymousRatio.anonymous }
                ]}
                index="name"
                valueFormatter={(number) => `${number} suggestions`}
                category="value"
                className="h-80"
                colors={["indigo", "amber"]}
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Most Commented Suggestions</h3>
              <div className="overflow-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.engagement.topCommented.map((suggestion) => (
                      <tr key={suggestion.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{suggestion.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{suggestion.commentCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${suggestion.status === 'Implemented' ? 'bg-green-100 text-green-800' : 
                              suggestion.status === 'Declined' ? 'bg-red-100 text-red-800' :
                              suggestion.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              suggestion.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {suggestion.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-medium mb-4">Activity by Day of Week</h3>
            <BarChart
              data={activityByDayData}
              index="day"
              categories={["Activities"]}
              colors={["indigo"]}
              valueFormatter={(number) => `${number} activities`}
              className="h-72"
            />
          </div>
        </div>
      )}

      {activeTab === 'departments' && metrics && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Suggestions by Department</h3>
              <PieChart
                data={departmentChartData}
                index="name"
                valueFormatter={(number) => `${number} suggestions`}
                category="value"
                className="h-80"
                colors={["indigo", "cyan", "amber", "emerald", "rose", "slate", "blue", "pink"]}
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Implementation Rate by Department</h3>
              <div className="overflow-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Implemented</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(metrics.departments.implementationByDepartment.rates).map(([dept, rate]) => (
                      <tr key={dept}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metrics.departments.implementationByDepartment.total[dept]}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metrics.departments.implementationByDepartment.implemented[dept]}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(rate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'implementation' && metrics && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Implemented</h3>
              <p className="text-3xl font-bold">{metrics.implementation.implementationRate.implemented}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Declined</h3>
              <p className="text-3xl font-bold">{metrics.implementation.implementationRate.declined}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm uppercase text-gray-500 font-medium">Avg. Time to Implementation</h3>
              <p className="text-3xl font-bold">{metrics.implementation.averageTimeToImplementation.averageDays.toFixed(1)} days</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-medium mb-4">Top Pending High Priority Suggestions</h3>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.implementation.pendingHighPriority.map((suggestion) => (
                    <tr key={suggestion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{suggestion.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${suggestion.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            suggestion.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {suggestion.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{suggestion.priorityScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{suggestion.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4">Implementation Rate</h3>
            <PieChart
              data={[
                { name: 'Implemented', value: metrics.implementation.implementationRate.implemented },
                { name: 'Declined', value: metrics.implementation.implementationRate.declined },
                { name: 'Other', value: metrics.implementation.implementationRate.total - metrics.implementation.implementationRate.implemented - metrics.implementation.implementationRate.declined }
              ]}
              index="name"
              valueFormatter={(number) => `${number} suggestions`}
              category="value"
              className="h-80"
              colors={["emerald", "rose", "amber"]}
            />
          </div>
        </div>
      )}

      {activeTab === 'trends' && metrics && (
        <div>
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-medium mb-4">Suggestion Creation Trend</h3>
            <LineChart
              data={trendChartData}
              index="date"
              categories={["New Suggestions"]}
              colors={["indigo"]}
              valueFormatter={(number) => number}
              yAxisWidth={40}
              className="h-80"
            />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4">Activity by Hour of Day</h3>
            <BarChart
              data={metrics.timeSeries.activityHeatmap.byHour.map((count, hour) => ({
                hour: hour.toString().padStart(2, '0') + ':00',
                Activities: count
              }))}
              index="hour"
              categories={["Activities"]}
              colors={["indigo"]}
              valueFormatter={(number) => `${number} activities`}
              className="h-80"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 