// Initial data for the application
export const initialSuggestions = [
  {
    id: 1,
    title: 'Improve meeting efficiency',
    description: 'Create a standardized format for meeting agendas and limit meetings to 45 minutes. This would help us stay focused and make better use of our time. Every meeting should have a clear objective, agenda, and action items at the end.',
    author: 'Taylor',
    authorInitial: 'T',
    authorId: 2,
    isAnonymous: false,
    status: 'In Progress',
    departments: ['Operations', 'HR'],
    votes: 5,
    comments: [
      { 
        id: 1, 
        author: 'Alex', 
        authorInitial: 'A', 
        authorId: 3,
        text: 'Great idea! This would save us hours each week.', 
        timestamp: '2 hours ago', 
        likes: 3,
        isAnonymous: false 
      }
    ],
    activity: [
      { 
        id: 1, 
        type: 'status', 
        from: 'New', 
        to: 'In Progress', 
        timestamp: '3 hours ago', 
        author: 'Morgan', 
        authorInitial: 'M' 
      }
    ],
    timestamp: '5 hours ago',
    visibility: 'Public',
    effortScore: 2,
    impactScore: 4,
    priorityScore: 8,
    mergedWith: []
  },
  {
    id: 2,
    title: 'Add coffee station to 2nd floor',
    description: 'The 2nd floor team has to go to the 1st floor for coffee, wasting time. Adding a small coffee station with a machine and supplies would improve productivity and morale for the entire floor.',
    author: 'Jordan',
    authorInitial: 'J',
    authorId: 4,
    isAnonymous: false,
    status: 'New',
    departments: ['Facilities'],
    votes: 8,
    comments: [],
    activity: [],
    timestamp: '1 day ago',
    visibility: 'Public',
    effortScore: 3,
    impactScore: 3,
    priorityScore: 9,
    mergedWith: []
  },
  {
    id: 3,
    title: 'Implement 4-day work week pilot',
    description: 'Many companies are experimenting with 4-day work weeks and seeing improvements in productivity and employee satisfaction. We should run a 3-month pilot program to see if this could work for our company.',
    author: 'Anonymous',
    authorInitial: '?',
    authorId: null,
    isAnonymous: true,
    status: 'Under Review',
    departments: ['HR', 'Executive'],
    votes: 15,
    comments: [
      { 
        id: 1, 
        author: 'Robin', 
        authorInitial: 'R', 
        authorId: 5,
        text: 'I fully support this! Research shows it can boost productivity.', 
        timestamp: '3 days ago', 
        likes: 7,
        isAnonymous: false 
      },
      { 
        id: 2, 
        author: 'Anonymous', 
        authorInitial: '?', 
        authorId: null,
        text: 'This would help with work-life balance and reduce burnout.', 
        timestamp: '2 days ago', 
        likes: 4,
        isAnonymous: true 
      }
    ],
    activity: [
      { 
        id: 1, 
        type: 'status', 
        from: 'New', 
        to: 'Under Review', 
        timestamp: '1 week ago', 
        author: 'Sam', 
        authorInitial: 'S' 
      }
    ],
    timestamp: '2 weeks ago',
    visibility: 'Public',
    effortScore: 4,
    impactScore: 5,
    priorityScore: 10,
    mergedWith: []
  }
];
