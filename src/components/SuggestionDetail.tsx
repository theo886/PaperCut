import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Edit, MessageCircle, Activity, GitMerge, Paperclip, MoreVertical, Trash, Lock, Pin } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import MergeSuggestionModal from './MergeSuggestionModal';
import FileUploader, { AttachmentList } from './FileUploader';
import { SuggestionDetailProps, User, Suggestion, Comment, Attachment } from '../types/index';

const SuggestionDetail: React.FC<SuggestionDetailProps> = ({ 
  suggestion, 
  isAdmin, 
  anonymousMode, 
  onBack, 
  onAddComment, 
  onUpdateStatus, 
  onUpdateScores,
  onMergeSuggestions,
  onDelete,
  onLock,
  onPin,
  currentUser,
  allSuggestions = []
}) => {
  // Add state for menu visibility
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
  // Add this useEffect to handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Check if current user can delete this suggestion
  const canDelete = isAdmin || (currentUser && suggestion.authorId === currentUser.userId);
  
  // States for edit mode
  const [isEditingStatus, setIsEditingStatus] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>(suggestion.status);
  const [isEditingScores, setIsEditingScores] = useState<boolean>(false);
  const [newEffortScore, setNewEffortScore] = useState<number>(suggestion.effortScore || 3);
  const [newImpactScore, setNewImpactScore] = useState<number>(suggestion.impactScore || 3);
  
  // States for merge modal
  const [mergeModalOpen, setMergeModalOpen] = useState<boolean>(false);
  
  // States for comments
  const [newComment, setNewComment] = useState<string>('');
  const [isAnonymousComment, setIsAnonymousComment] = useState<boolean>(anonymousMode);
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);
  
  // Update isAnonymousComment when anonymousMode prop changes
  useEffect(() => {
    setIsAnonymousComment(anonymousMode);
  }, [anonymousMode]);
  
  // Handle updating the suggestion status
  const handleStatusUpdate = (): void => {
    if (newStatus !== suggestion.status) {
      onUpdateStatus(suggestion.id, newStatus);
    }
    setIsEditingStatus(false);
  };
  
  // Handle updating scores
  const handleScoresUpdate = (): void => {
    onUpdateScores(suggestion.id, newEffortScore, newImpactScore);
    setIsEditingScores(false);
  };
  
  // Handle adding a new comment
  const handleAddComment = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(suggestion.id, newComment, isAnonymousComment, commentAttachments);
      setNewComment('');
      setCommentAttachments([]);
    }
  };
  
  // Filter merged suggestions for the dropdown
  const availableSuggestions = allSuggestions.filter(s => 
    s.id !== suggestion.id && s.status !== 'Merged'
  );
  
  // Handle attachment upload for comments
  const handleFileUploaded = (fileInfo: Attachment): void => {
    setCommentAttachments([...commentAttachments, fileInfo]);
  };
  
  // Remove an attachment from the comment
  const removeAttachment = (index: number): void => {
    const newAttachments = [...commentAttachments];
    newAttachments.splice(index, 1);
    setCommentAttachments(newAttachments);
  };
  
  // Get status class for the badge
  const getStatusClass = (status: string): string => {
    switch(status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Implemented':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      case 'Merged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // For effort and impact scoring
  const getEffortLabel = (score: number): string => {
    switch(score) {
      case 1: return 'Trivial';
      case 2: return 'Minor';
      case 3: return 'Moderate';
      case 4: return 'Significant';
      case 5: return 'Major';
      default: return 'Not Set';
    }
  };
  
  const getImpactLabel = (score: number): string => {
    switch(score) {
      case 1: return 'Minimal';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Critical';
      default: return 'Not Set';
    }
  };
  
  const getEffortClass = (score: number): string => {
    switch(score) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-green-50 text-green-600';
      case 3: return 'bg-yellow-50 text-yellow-600';
      case 4: return 'bg-orange-50 text-orange-600';
      case 5: return 'bg-red-50 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  const getImpactClass = (score: number): string => {
    switch(score) {
      case 1: return 'bg-gray-100 text-gray-600';
      case 2: return 'bg-blue-50 text-blue-600';
      case 3: return 'bg-indigo-50 text-indigo-600';
      case 4: return 'bg-purple-50 text-purple-600';
      case 5: return 'bg-pink-50 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Format timestamp
  const formattedDate = formatDate(suggestion.timestamp);
  
  const renderActions = (): JSX.Element => (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-full"
        aria-label="Menu"
      >
        <MoreVertical size={20} />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
          {isAdmin && (
            <>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  onLock(suggestion.id, !suggestion.isLocked);
                }}
              >
                <Lock size={16} className="mr-2" />
                {suggestion.isLocked ? 'Unlock suggestion' : 'Lock suggestion'}
              </button>
              
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  onPin(suggestion.id, !suggestion.isPinned);
                }}
              >
                <Pin size={16} className="mr-2" />
                {suggestion.isPinned ? 'Unpin suggestion' : 'Pin suggestion'}
              </button>
              
              <button
                id="openMergeModalButton"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  setShowMenu(false);
                  setMergeModalOpen(true);
                }}
              >
                <GitMerge size={16} className="mr-2" />
                Merge with another suggestion
              </button>
            </>
          )}
          
          {canDelete && (
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center"
              onClick={() => {
                setShowMenu(false);
                onDelete(suggestion.id);
              }}
            >
              <Trash size={16} className="mr-2" />
              Delete suggestion
            </button>
          )}
        </div>
      )}
    </div>
  );
  
  // Check if the suggestion has any attachments
  const hasAttachments = suggestion.attachments && suggestion.attachments.length > 0;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-800 inline-flex items-center"
        >
          ← Back to all suggestions
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            {suggestion.isPinned && (
              <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-medium inline-flex items-center mb-2">
                <Pin size={12} className="mr-1" /> Pinned
              </div>
            )}
            
            <h1 className="text-2xl font-bold mb-2">{suggestion.title}</h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4 gap-2">
              <span>Posted by {anonymousMode || suggestion.isAnonymous ? 'Anonymous' : suggestion.author}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(suggestion.status)}`}>
                {suggestion.status}
              </span>
              
              {suggestion.isLocked && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center">
                  <Lock size={10} className="mr-1" /> Locked
                </span>
              )}
            </div>
            
            {suggestion.departments && suggestion.departments.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {suggestion.departments.map(dept => (
                  <span 
                    key={dept} 
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {(isAdmin || canDelete) && renderActions()}
        </div>
        
        <div className="prose max-w-none mb-6">
          <pre className="whitespace-pre-wrap font-sans text-base">{suggestion.description}</pre>
        </div>
        
        {hasAttachments && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
            <AttachmentList attachments={suggestion.attachments} onRemove={() => {}} />
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <button className="flex items-center space-x-1 text-gray-500">
              <MessageCircle size={18} />
              <span>{suggestion.comments.length} comments</span>
            </button>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-500">
              <Activity size={18} className="inline mr-1" />
              {suggestion.votes} votes
            </span>
          </div>
          
          {isAdmin && (
            <div className="ml-auto flex items-center space-x-4">
              {!isEditingStatus ? (
                <button 
                  onClick={() => setIsEditingStatus(true)} 
                  className="text-indigo-600 hover:underline flex items-center"
                >
                  <Edit size={14} className="mr-1" /> Update Status
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <select 
                    value={newStatus} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Declined">Declined</option>
                  </select>
                  <button 
                    onClick={handleStatusUpdate}
                    className="bg-indigo-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditingStatus(false)}
                    className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {!isEditingScores ? (
                <button 
                  onClick={() => setIsEditingScores(true)} 
                  className="text-indigo-600 hover:underline flex items-center"
                >
                  <Edit size={14} className="mr-1" /> 
                  {suggestion.effortScore && suggestion.impactScore ? 'Update Scores' : 'Add Scores'}
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500">Effort</label>
                    <select 
                      value={newEffortScore} 
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewEffortScore(parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={1}>1 - Trivial</option>
                      <option value={2}>2 - Minor</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - Significant</option>
                      <option value={5}>5 - Major</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500">Impact</label>
                    <select 
                      value={newImpactScore} 
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewImpactScore(parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={1}>1 - Minimal</option>
                      <option value={2}>2 - Low</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <button 
                      onClick={handleScoresUpdate}
                      className="bg-indigo-600 text-white px-2 py-1 rounded text-sm mt-4"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditingScores(false)}
                      className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm mt-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {suggestion.effortScore > 0 && suggestion.impactScore > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEffortClass(suggestion.effortScore)}`}>
              Effort: {getEffortLabel(suggestion.effortScore)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImpactClass(suggestion.impactScore)}`}>
              Impact: {getImpactLabel(suggestion.impactScore)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Priority Score: {suggestion.priorityScore || ((6 - suggestion.effortScore) * suggestion.impactScore)}
            </span>
          </div>
        )}
      </div>
      
      {suggestion.mergedWith && suggestion.mergedWith.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <GitMerge size={18} className="mr-2" /> Merged Suggestions
          </h2>
          <ul className="space-y-2">
            {suggestion.mergedWith.map(merge => (
              <li key={merge.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-medium">{merge.title}</span>
                  <div className="text-sm text-gray-500">{formatDate(merge.timestamp)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <MessageCircle size={18} className="mr-2" /> Comments ({suggestion.comments.length})
        </h2>
        
        {suggestion.comments.length > 0 ? (
          <div className="space-y-4 mb-6">
            {suggestion.comments.map(comment => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-medium">
                      {anonymousMode || comment.isAnonymous ? 'A' : comment.authorInitial}
                    </div>
                    <div>
                      <div className="font-medium">
                        {anonymousMode || comment.isAnonymous ? 'Anonymous' : comment.author}
                        {comment.fromMerged && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded ml-2">
                            From merged suggestion
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(comment.timestamp)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-10">
                  <div className="text-gray-800 mb-2 whitespace-pre-wrap">{comment.text}</div>
                  
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentList attachments={comment.attachments} onRemove={() => {}} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mb-6">No comments yet. Be the first to comment!</div>
        )}
        
        {!suggestion.isLocked && (
          <form onSubmit={handleAddComment}>
            <div className="mb-4">
              <textarea
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a comment..."
                rows={4}
                value={newComment}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <FileUploader onFileUploaded={handleFileUploaded} />
              {commentAttachments.length > 0 && (
                <div className="mt-2">
                  <AttachmentList attachments={commentAttachments} onRemove={removeAttachment} />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600"
                  checked={isAnonymousComment}
                  onChange={() => setIsAnonymousComment(!isAnonymousComment)}
                />
                <span className="ml-2 text-sm text-gray-700">Post anonymously</span>
              </label>
              
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
            </div>
          </form>
        )}
        
        {suggestion.isLocked && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-gray-600 flex items-center">
            <Lock size={18} className="mr-2" />
            This suggestion is locked and cannot receive new comments.
          </div>
        )}
      </div>
      
      <MergeSuggestionModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        targetSuggestion={suggestion}
        availableSuggestions={availableSuggestions}
        onMerge={onMergeSuggestions}
        isLoading={false}
      />
    </div>
  );
};

export default SuggestionDetail; 