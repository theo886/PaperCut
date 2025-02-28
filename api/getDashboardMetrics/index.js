const { getContainer } = require('../shared/cosmosClient');
const { authenticate } = require('../shared/authMiddleware');

module.exports = async function (context, req) {
    try {
        // Authenticate the user
        let userData;
        try {
            userData = authenticate(req);
            context.log('User authenticated:', userData);
        } catch (error) {
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
        const metrics = {
            summary: {
                total: suggestions.length,
                active: suggestions.filter(s => s.status !== 'Merged').length,
                statusCounts: countByStatus(suggestions),
                averagePerWeek: calculateWeeklyAverage(suggestions)
            },
            engagement: {
                topVoted: getTopVoted(suggestions, 5),
                topCommented: getTopCommented(suggestions, 5),
                anonymousRatio: calculateAnonymousRatio(suggestions),
                commentCount: countTotalComments(suggestions)
            },
            departments: {
                byDepartment: countByDepartment(suggestions),
                implementationByDepartment: calculateImplementationByDepartment(suggestions)
            },
            implementation: {
                implementationRate: calculateImplementationRate(suggestions),
                averageTimeToImplementation: calculateAverageTimeToImplementation(suggestions),
                pendingHighPriority: getPendingHighPriority(suggestions, 5)
            },
            timeSeries: {
                creationTrend: calculateCreationTrend(suggestions),
                activityHeatmap: calculateActivityHeatmap(suggestions)
            }
        };
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: metrics
        };
    } catch (error) {
        context.log.error('Error generating dashboard metrics:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { message: 'Error generating dashboard metrics', error: error.message }
        };
    }
};

// Helper functions

function countByStatus(suggestions) {
    const statusCounts = {
        'New': 0,
        'Under Review': 0,
        'In Progress': 0,
        'Implemented': 0,
        'Declined': 0,
        'Merged': 0
    };
    
    suggestions.forEach(suggestion => {
        if (statusCounts[suggestion.status] !== undefined) {
            statusCounts[suggestion.status]++;
        } else {
            statusCounts[suggestion.status] = 1;
        }
    });
    
    return statusCounts;
}

function getTopVoted(suggestions, limit) {
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

function getTopCommented(suggestions, limit) {
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

function calculateAnonymousRatio(suggestions) {
    const anonymousCount = suggestions.filter(s => s.isAnonymous).length;
    return {
        anonymous: anonymousCount,
        named: suggestions.length - anonymousCount,
        ratio: suggestions.length > 0 ? anonymousCount / suggestions.length : 0
    };
}

function countTotalComments(suggestions) {
    return suggestions.reduce((sum, s) => sum + (s.comments?.length || 0), 0);
}

function countByDepartment(suggestions) {
    const departmentCounts = {};
    
    suggestions.forEach(suggestion => {
        if (suggestion.departments && suggestion.departments.length > 0) {
            suggestion.departments.forEach(dept => {
                if (departmentCounts[dept]) {
                    departmentCounts[dept]++;
                } else {
                    departmentCounts[dept] = 1;
                }
            });
        } else {
            // Count suggestions without departments
            if (departmentCounts['Unspecified']) {
                departmentCounts['Unspecified']++;
            } else {
                departmentCounts['Unspecified'] = 1;
            }
        }
    });
    
    return departmentCounts;
}

function calculateImplementationByDepartment(suggestions) {
    const deptImplementations = {};
    const deptTotals = {};
    
    suggestions.forEach(suggestion => {
        const isImplemented = suggestion.status === 'Implemented';
        
        if (suggestion.departments && suggestion.departments.length > 0) {
            suggestion.departments.forEach(dept => {
                if (!deptTotals[dept]) {
                    deptTotals[dept] = 0;
                    deptImplementations[dept] = 0;
                }
                
                deptTotals[dept]++;
                
                if (isImplemented) {
                    deptImplementations[dept]++;
                }
            });
        } else {
            // Handle suggestions without departments
            if (!deptTotals['Unspecified']) {
                deptTotals['Unspecified'] = 0;
                deptImplementations['Unspecified'] = 0;
            }
            
            deptTotals['Unspecified']++;
            
            if (isImplemented) {
                deptImplementations['Unspecified']++;
            }
        }
    });
    
    // Calculate implementation rates
    const implementationRates = {};
    
    Object.keys(deptTotals).forEach(dept => {
        implementationRates[dept] = deptTotals[dept] > 0 
            ? deptImplementations[dept] / deptTotals[dept] 
            : 0;
    });
    
    return {
        total: deptTotals,
        implemented: deptImplementations,
        rates: implementationRates
    };
}

function calculateImplementationRate(suggestions) {
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

function calculateAverageTimeToImplementation(suggestions) {
    const implementedSuggestions = suggestions.filter(s => 
        s.status === 'Implemented' && s.timestamp
    );
    
    if (implementedSuggestions.length === 0) {
        return { averageDays: 0, count: 0 };
    }
    
    let totalDays = 0;
    let count = 0;
    
    implementedSuggestions.forEach(suggestion => {
        // Find the status change activity marking implementation
        const implementedActivity = suggestion.activity?.find(a => 
            a.type === 'status' && a.to === 'Implemented'
        );
        
        if (implementedActivity && implementedActivity.timestamp && suggestion.timestamp) {
            const createdDate = new Date(suggestion.timestamp);
            const implementedDate = new Date(implementedActivity.timestamp);
            const diffTime = Math.abs(implementedDate - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            totalDays += diffDays;
            count++;
        }
    });
    
    return {
        averageDays: count > 0 ? totalDays / count : 0,
        count: count
    };
}

function getPendingHighPriority(suggestions, limit) {
    return [...suggestions]
        .filter(s => 
            s.status !== 'Implemented' && 
            s.status !== 'Declined' && 
            s.status !== 'Merged'
        )
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, limit)
        .map(s => ({
            id: s.id,
            title: s.title,
            status: s.status,
            priorityScore: s.priorityScore || 0,
            votes: s.votes
        }));
}

function calculateWeeklyAverage(suggestions) {
    if (suggestions.length === 0) {
        return 0;
    }
    
    // Sort suggestions by creation date
    const sortedSuggestions = [...suggestions].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Get first and last dates
    const firstDate = new Date(sortedSuggestions[0].timestamp);
    const lastDate = new Date(sortedSuggestions[sortedSuggestions.length - 1].timestamp);
    
    // Calculate weeks between
    const diffTime = Math.abs(lastDate - firstDate);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Handle case when all suggestions were created in the same week
    const weeksCount = Math.max(1, diffWeeks);
    
    return suggestions.length / weeksCount;
}

function calculateCreationTrend(suggestions) {
    if (suggestions.length === 0) {
        return [];
    }
    
    // Group suggestions by month
    const monthCounts = {};
    
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

function calculateActivityHeatmap(suggestions) {
    // Initialize counters for each day and hour
    const activityByHour = Array(24).fill(0);
    const activityByDay = Array(7).fill(0);
    
    // Count activities
    let totalActivities = 0;
    
    suggestions.forEach(suggestion => {
        // Count creation time
        if (suggestion.timestamp) {
            const date = new Date(suggestion.timestamp);
            const hour = date.getHours();
            const day = date.getDay();
            
            activityByHour[hour]++;
            activityByDay[day]++;
            totalActivities++;
        }
        
        // Count comments
        if (suggestion.comments) {
            suggestion.comments.forEach(comment => {
                if (comment.timestamp) {
                    const date = new Date(comment.timestamp);
                    const hour = date.getHours();
                    const day = date.getDay();
                    
                    activityByHour[hour]++;
                    activityByDay[day]++;
                    totalActivities++;
                }
            });
        }
        
        // Count other activities
        if (suggestion.activity) {
            suggestion.activity.forEach(activity => {
                if (activity.timestamp) {
                    const date = new Date(activity.timestamp);
                    const hour = date.getHours();
                    const day = date.getDay();
                    
                    activityByHour[hour]++;
                    activityByDay[day]++;
                    totalActivities++;
                }
            });
        }
    });
    
    return {
        byHour: activityByHour,
        byDay: activityByDay,
        total: totalActivities
    };
} 