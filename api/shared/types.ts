// API Request/Response types
export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims?: {
    typ: string;
    val: string;
  }[];
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
}

export interface UserData {
  userId: string;
  userDetails: string;
  userRoles: string[];
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
}

// Define our own request interface without extending the browser Request
export interface AuthenticatedRequest {
  method?: string;
  url?: string;
  headers: {
    [key: string]: string | undefined;
    'x-ms-client-principal'?: string;
    'x-admin-status'?: string;
  };
  query?: {
    [key: string]: string | undefined;
  };
  params?: {
    [key: string]: string | undefined;
  };
  body?: any;
}

export interface ApiResponse {
  status: number;
  headers?: {
    [key: string]: string;
  };
  body: any;
}

// Main models
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  author: string;
  authorInitial: string;
  authorId: string | null;
  isAnonymous: boolean;
  status: string;
  departments: string[];
  votes: number;
  voters?: string[];
  comments: Comment[];
  activity: Activity[];
  timestamp: string;
  effortScore: number;
  impactScore: number;
  priorityScore: number;
  mergedWith: MergedSuggestion[];
  attachments: Attachment[];
  isLocked?: boolean;
  isPinned?: boolean;
  hasVoted?: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorInitial: string;
  authorId: string | null;
  isAnonymous: boolean;
  timestamp: string;
  likes: number;
  likedBy: string[];
  attachments: Attachment[];
  fromMerged?: boolean;
  isMergeDescription?: boolean;
  originalSuggestionId?: string;
  originalSuggestionTitle?: string;
}

export interface Activity {
  id: string;
  type: string;
  status?: string;
  from?: string;
  to?: string;
  sourceId?: string;
  sourceTitle?: string;
  timestamp: string;
  author: string;
  authorInitial: string;
  authorId: string;
}

export interface Attachment {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  isImage: boolean;
}

export interface MergedSuggestion {
  id: string;
  title: string;
  timestamp: string;
}

export interface FileData {
  name: string;
  size: number;
  contentType: string;
  data: string;
}

export interface SuggestionFormData {
  title: string;
  description: string;
  isAnonymous: boolean;
  attachments: Attachment[];
  departments: string[];
}

export interface MergeSuggestionsRequestBody {
  targetId: string;
  sourceId: string;
}

export interface LockSuggestionRequestBody {
  isLocked: boolean;
}

export interface PinSuggestionRequestBody {
  isPinned: boolean;
}

export interface UpdateScoresRequestBody {
  effortScore: number;
  impactScore: number;
}

export interface DashboardMetrics {
  totalSuggestions: number;
  totalComments: number;
  totalVotes: number;
  statusCounts: {
    [key: string]: number;
  };
  departmentCounts: {
    [key: string]: number;
  };
  topVotedSuggestions: Suggestion[];
  topCommentedSuggestions: Suggestion[];
  anonymousPercentage: number;
  implementationRate: number;
  implementationByDepartment: {
    [key: string]: {
      total: number;
      implemented: number;
      percentage: number;
    };
  };
  averageTimeToImplementation: number;
  pendingHighPriority: Suggestion[];
  weeklyCreationAverage: number;
  creationTrend: {
    [key: string]: number;
  };
  activityHeatmap: {
    [key: string]: number;
  };
} 