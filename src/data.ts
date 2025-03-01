import { Suggestion, Comment, Activity } from './types';

// Initial data for the application
export const initialSuggestions: Suggestion[] = [
  {
    id: "1",
    title: 'Improve meeting efficiency',
    description: 'Create a standardized format for meeting agendas and limit meetings to 45 minutes. This would help us stay focused and make better use of our time. Every meeting should have a clear objective, agenda, and action items at the end.',
    author: 'Taylor',
    authorInitial: 'T',
    authorId: "2",
    isAnonymous: false,
    status: 'In Progress',
    departments: ['Operations', 'HR'],
    votes: 5,
    voters: [],
    comments: [
      { 
        id: "1", 
        author: 'Alex', 
        authorInitial: 'A', 
        authorId: "3",
        text: 'Great idea! This would save us hours each week.', 
        timestamp: '2023-05-20T15:30:00.000Z', 
        likes: 3,
        likedBy: [],
        isAnonymous: false,
        attachments: []
      }
    ],
    activity: [
      { 
        id: "1", 
        type: 'status', 
        from: 'New', 
        to: 'In Progress', 
        timestamp: '2023-05-20T14:00:00.000Z', 
        author: 'Morgan', 
        authorInitial: 'M',
        authorId: "4"
      }
    ],
    timestamp: '2023-05-20T12:00:00.000Z',
    effortScore: 2,
    impactScore: 4,
    priorityScore: 8,
    mergedWith: [],
    attachments: []
  },
  {
    id: "2",
    title: 'Add coffee station to 2nd floor',
    description: 'The 2nd floor team has to go to the 1st floor for coffee, wasting time. Adding a small coffee station with a machine and supplies would improve productivity and morale for the entire floor.',
    author: 'Jordan',
    authorInitial: 'J',
    authorId: "4",
    isAnonymous: false,
    status: 'New',
    departments: ['Facilities'],
    votes: 8,
    voters: [],
    comments: [],
    activity: [],
    timestamp: '2023-05-19T12:00:00.000Z',
    effortScore: 3,
    impactScore: 3,
    priorityScore: 9,
    mergedWith: [],
    attachments: []
  },
  {
    id: "3",
    title: 'Implement 4-day work week pilot',
    description: 'Many companies are experimenting with 4-day work weeks and seeing improvements in productivity and employee satisfaction. We should run a 3-month pilot program to see if this could work for our company.',
    author: 'Anonymous',
    authorInitial: '?',
    authorId: null,
    isAnonymous: true,
    status: 'Under Review',
    departments: ['HR', 'Executive'],
    votes: 15,
    voters: [],
    comments: [
      { 
        id: "1", 
        author: 'Robin', 
        authorInitial: 'R', 
        authorId: "5",
        text: 'I fully support this! Research shows it can boost productivity.', 
        timestamp: '2023-05-17T12:00:00.000Z', 
        likes: 7,
        likedBy: [],
        isAnonymous: false,
        attachments: []
      },
      { 
        id: "2", 
        author: 'Anonymous', 
        authorInitial: '?', 
        authorId: null,
        text: 'This would help with work-life balance and reduce burnout.', 
        timestamp: '2023-05-18T12:00:00.000Z', 
        likes: 4,
        likedBy: [],
        isAnonymous: true,
        attachments: []
      }
    ],
    activity: [
      { 
        id: "1", 
        type: 'status', 
        from: 'New', 
        to: 'Under Review', 
        timestamp: '2023-05-13T12:00:00.000Z', 
        author: 'Sam', 
        authorInitial: 'S',
        authorId: "6"
      }
    ],
    timestamp: '2023-05-06T12:00:00.000Z',
    effortScore: 4,
    impactScore: 5,
    priorityScore: 10,
    mergedWith: [],
    attachments: []
  }
]; 