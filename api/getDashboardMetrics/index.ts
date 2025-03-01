import { Context } from "@azure/functions";
import { getContainer } from '../shared/cosmosClient';
import { authenticate } from '../shared/authMiddleware';
import { AuthenticatedRequest, Suggestion, DashboardMetrics } from '../shared/types';

interface TopSuggestion {
    id: string;
    title: string;
    votes?: number;
    commentCount?: number;
    status: string;
}

interface AnonymousRatio {
    anonymous: number;
    named: number;
    ratio: number;
}

interface ImplementationRate {
    implemented: number;
    declined: number;
    total: number;
    rate: number;
}

interface TrendItem {
    month: string;
    count: number;
}

interface DepartmentImplementation {
    [department: string]: {
        total: number;
        implemented: number;
        rate: number;
    };
}

interface StatusCounts {
    [status: string]: number;
}

interface DepartmentCounts {
    [department: string]: number;
}

interface CompleteMetrics {
    summary: {
        total: number;
        active: number;
        statusCounts: StatusCounts;
        averagePerWeek: number;
    };
    engagement: {
        topVoted: TopSuggestion[];
        topCommented: TopSuggestion[];
        anonymousRatio: AnonymousRatio;
        commentCount: number;
    };
    departments: {
        byDepartment: DepartmentCounts;
        implementationByDepartment: DepartmentImplementation;
    };
    implementation: {
        implementationRate: ImplementationRate;
        averageTimeToImplementation: number;
        pendingHighPriority: TopSuggestion[];
    };
    timeSeries: {
        creationTrend: TrendItem[];
        activityHeatmap: { [key: string]: number };
    };
}

export default async function (context: Context, req: AuthenticatedRequest): Promise<void> {
    try {
        // Authenticate the user
        let userData;
        try {
            userData = authenticate(req);
            context.log('User authenticated:', userData);
        } catch (error: any) {
            context.res = {
                status: error.status || 401,
                body: { message: error.message || "Authentication required" }
            };
            return;
        }
        
        // Check if user is admin
        const isAdmin = userData.userRoles.includes('admin') || 
                       userData.userRoles.includes('administrator') || 
                       userData.userRoles.includes('Owner') ||
                       req.headers['x-admin-status'] === 'true';
        
        if (!isAdmin) {
            context.res = {
                status: 403,
                body: { message: "Only administrators can access dashboard metrics" }
            };
            return;
        }

        const container = await getContainer();
        
        // Query all suggestions
        const { resources: suggestions } = await container.items
            .query("SELECT * FROM c")
            .fetchAll();
            
        // Calculate metrics
        const metrics: CompleteMetrics = {
            summary: {
                total: suggestions.length,
                active: suggestions.filter(s => s.status !== 'Merged').length,
                statusCounts: countByStatus(suggestions as Suggestion[]),
                averagePerWeek: calculateWeeklyAverage(suggestions as Suggestion[])
            },
            engagement: {
                topVoted: getTopVoted(suggestions as Suggestion[], 5),
                topCommented: getTopCommented(suggestions as Suggestion[], 5),
                anonymousRatio: calculateAnonymousRatio(suggestions as Suggestion[]),
                commentCount: countTotalComments(suggestions as Suggestion[])
            },
            departments: {
                byDepartment: countByDepartment(suggestions as Suggestion[]),
                implementationByDepartment: calculateImplementationByDepartment(suggestions as Suggestion[])
            },
            implementation: {
                implementationRate: calculateImplementationRate(suggestions as Suggestion[]),
                averageTimeToImplementation: calculateAverageTimeToImplementation(suggestions as Suggestion[]),
                pendingHighPriority: getPendingHighPriority(suggestions as Suggestion[], 5)
            },
            timeSeries: {
                creationTrend: calculateCreationTrend(suggestions as Suggestion[]),
                activityHeatmap: calculateActivityHeatmap(suggestions as Suggestion[])
            }
        };
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: metrics
        };
    } catch (error: any) {
        context.log.error('Error generating dashboard metrics:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error generating dashboard metrics', error: error.message }
        };
    }
}

function countByStatus(suggestions: Suggestion[]): StatusCounts {
    const counts: StatusCounts = {};
    
    suggestions.forEach(suggestion => {
        const status = suggestion.status || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
    });
    
    return counts;
}

function getTopVoted(suggestions: Suggestion[], limit: number): TopSuggestion[] {
    return [...suggestions]
        .sort((a, b) => b.votes - a.votes)
        .slice(0, limit)
        .map(s => ({
            id: s.id,
            title: s.title,
            votes: s.votes,
            status: s.status
        }));
}

function getTopCommented(suggestions: Suggestion[], limit: number): TopSuggestion[] {
    return [...suggestions]
        .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
        .slice(0, limit)
        .map(s => ({
            id: s.id,
            title: s.title,
            commentCount: s.comments?.length || 0,
            status: s.status
        }));
}

function calculateAnonymousRatio(suggestions: Suggestion[]): AnonymousRatio {
    const anonymousCount = suggestions.filter(s => s.isAnonymous).length;
    return {
        anonymous: anonymousCount,
        named: suggestions.length - anonymousCount,
        ratio: suggestions.length > 0 ? anonymousCount / suggestions.length : 0
    };
}

function countTotalComments(suggestions: Suggestion[]): number {
    return suggestions.reduce((sum, s) => sum + (s.comments?.length || 0), 0);
}

function countByDepartment(suggestions: Suggestion[]): DepartmentCounts {
    const counts: DepartmentCounts = {};
    
    suggestions.forEach(suggestion => {
        if (suggestion.departments && suggestion.departments.length > 0) {
            suggestion.departments.forEach(dept => {
                counts[dept] = (counts[dept] || 0) + 1;
            });
        } else {
            counts['Unassigned'] = (counts['Unassigned'] || 0) + 1;
        }
    });
    
    return counts;
}

function calculateImplementationByDepartment(suggestions: Suggestion[]): DepartmentImplementation {
    const deptStats: DepartmentImplementation = {};
    
    suggestions.forEach(suggestion => {
        const depts = suggestion.departments && suggestion.departments.length > 0 
            ? suggestion.departments 
            : ['Unassigned'];
            
        depts.forEach(dept => {
            if (!deptStats[dept]) {
                deptStats[dept] = { total: 0, implemented: 0, rate: 0 };
            }
            
            deptStats[dept].total++;
            
            if (suggestion.status === 'Implemented') {
                deptStats[dept].implemented++;
            }
        });
    });
    
    // Calculate implementation rates
    Object.keys(deptStats).forEach(dept => {
        const { implemented, total } = deptStats[dept];
        deptStats[dept].rate = total > 0 ? implemented / total : 0;
    });
    
    return deptStats;
}

function calculateImplementationRate(suggestions: Suggestion[]): ImplementationRate {
    const implementedCount = suggestions.filter(s => s.status === 'Implemented').length;
    const declinedCount = suggestions.filter(s => s.status === 'Declined').length;
    const totalResolved = implementedCount + declinedCount;
    
    return {
        implemented: implementedCount,
        declined: declinedCount,
        total: suggestions.length,
        rate: totalResolved > 0 ? implementedCount / totalResolved : 0
    };
}

function calculateAverageTimeToImplementation(suggestions: Suggestion[]): number {
    const implementedSuggestions = suggestions.filter(s => 
        s.status === 'Implemented' && s.activity && s.activity.length > 0
    );
    
    if (implementedSuggestions.length === 0) {
        return 0;
    }
    
    let totalDays = 0;
    let countWithDates = 0;
    
    implementedSuggestions.forEach(s => {
        const creationDate = new Date(s.timestamp);
        
        // Find the implementation date from activity
        const implementActivity = s.activity.find(a => 
            a.type === 'status' && a.to === 'Implemented'
        );
        
        if (implementActivity && implementActivity.timestamp) {
            const implementDate = new Date(implementActivity.timestamp);
            const daysDiff = (implementDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
            
            totalDays += daysDiff;
            countWithDates++;
        }
    });
    
    return countWithDates > 0 ? totalDays / countWithDates : 0;
}

function getPendingHighPriority(suggestions: Suggestion[], limit: number): TopSuggestion[] {
    return [...suggestions]
        .filter(s => s.status !== 'Implemented' && s.status !== 'Declined' && s.status !== 'Merged')
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, limit)
        .map(s => ({
            id: s.id,
            title: s.title,
            status: s.status
        }));
}

function calculateWeeklyAverage(suggestions: Suggestion[]): number {
    if (suggestions.length === 0) {
        return 0;
    }
    
    // Sort suggestions by creation date
    const sortedSuggestions = [...suggestions].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Get first and last dates
    const firstDate = new Date(sortedSuggestions[0].timestamp);
    const lastDate = new Date(sortedSuggestions[sortedSuggestions.length - 1].timestamp);
    
    // Calculate weeks between
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Handle case when all suggestions were created in the same week
    const weeksCount = Math.max(1, diffWeeks);
    
    return suggestions.length / weeksCount;
}

function calculateCreationTrend(suggestions: Suggestion[]): TrendItem[] {
    if (suggestions.length === 0) {
        return [];
    }
    
    // Group suggestions by month
    const monthCounts: { [key: string]: number } = {};
    
    suggestions.forEach(suggestion => {
        if (suggestion.timestamp) {
            const date = new Date(suggestion.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthCounts[monthKey]) {
                monthCounts[monthKey]++;
            } else {
                monthCounts[monthKey] = 1;
            }
        }
    });
    
    // Convert to array sorted by month
    return Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateActivityHeatmap(suggestions: Suggestion[]): { [key: string]: number } {
    const dayOfWeekCounts: { [key: string]: number } = {
        '0': 0, // Sunday
        '1': 0, // Monday
        '2': 0, // Tuesday
        '3': 0, // Wednesday
        '4': 0, // Thursday
        '5': 0, // Friday
        '6': 0  // Saturday
    };
    
    // Count all activities (creation, comments, status changes)
    suggestions.forEach(suggestion => {
        // Count creation date
        if (suggestion.timestamp) {
            const creationDate = new Date(suggestion.timestamp);
            const dayOfWeek = creationDate.getDay().toString();
            dayOfWeekCounts[dayOfWeek]++;
        }
        
        // Count comments
        if (suggestion.comments && suggestion.comments.length > 0) {
            suggestion.comments.forEach(comment => {
                if (comment.timestamp) {
                    const commentDate = new Date(comment.timestamp);
                    const dayOfWeek = commentDate.getDay().toString();
                    dayOfWeekCounts[dayOfWeek]++;
                }
            });
        }
        
        // Count activities
        if (suggestion.activity && suggestion.activity.length > 0) {
            suggestion.activity.forEach(activity => {
                if (activity.timestamp) {
                    const activityDate = new Date(activity.timestamp);
                    const dayOfWeek = activityDate.getDay().toString();
                    dayOfWeekCounts[dayOfWeek]++;
                }
            });
        }
    });
    
    return dayOfWeekCounts;
} 