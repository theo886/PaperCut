// User and Authentication types
export interface User {
  userId: string;
  userDetails: string;
  userRoles: string[];
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  initial?: string;
  claims?: {
    typ: string;
    val: string;
  }[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
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

// Component Props Types
export interface HeaderProps {
  anonymousMode: boolean;
  toggleAnonymousMode: () => void;
  setView: (view: string) => void;
  user: User | null;
  showDashboard?: boolean;
}

export interface SuggestionDetailProps {
  suggestion: Suggestion;
  isAdmin: boolean;
  anonymousMode: boolean;
  onBack: () => void;
  onAddComment: (id: string, text: string, isAnonymous: boolean, attachments?: Attachment[]) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onUpdateScores: (id: string, effortScore: number, impactScore: number) => Promise<void>;
  onMergeSuggestions: (targetId: string, sourceId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLock: (id: string, isLocked: boolean) => Promise<void>;
  onPin: (id: string, isPinned: boolean) => Promise<void>;
  currentUser: User | null;
  allSuggestions?: Suggestion[];
}

export interface SuggestionFormProps {
  onSubmit: (data: SuggestionFormData) => void;
  onCancel: () => void;
  anonymousMode: boolean;
  isSubmitting: boolean;
  existingSuggestions?: Suggestion[];
  onViewSuggestion: (id: string) => void;
}

export interface DashboardProps {
  isAdmin: boolean;
  onBack: () => void;
}

export interface MergeSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSuggestion: Suggestion | null;
  availableSuggestions: Suggestion[];
  onMerge: (targetId: string, sourceId: string) => void;
  isLoading: boolean;
}

export interface FileUploaderProps {
  onFileUploaded: (fileInfo: Attachment) => void;
  disabled?: boolean;
}

export interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (index: number) => void;
}

export interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label: string;
}

export interface SimilarPostsDropdownProps {
  suggestions: Suggestion[];
  searchTerm: string;
  onSuggestionClick: (id: string) => void;
} 