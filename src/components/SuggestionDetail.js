import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MessageCircle, Check, X, Edit3, UserX, Paperclip, 
  Award, Shield, GitMerge, Clock, ArrowRight, Trash, Heart, MoreVertical,
  Edit, Activity, Lock, Pin
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import apiService from '../services/apiService';
import Attachment from './Attachment';
import FileUploader from './FileUploader';
import MergeSuggestionModal from './MergeSuggestionModal';

// Add comment status indicator
const EditedLabel = ({ timestamp }) => (
  <span className="text-xs text-gray-400 italic ml-1">
    (edited {formatRelativeTime(timestamp)})
  </span>
);

const SuggestionDetail = ({ 
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
  allSuggestions = [],
  onCommentDeleted
}) => {
  const [status, setStatus] = useState(suggestion.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusRef = useRef(null);
  
  // Add state for menu visibility
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Add this useEffect to handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Check if current user can delete this suggestion
  const canDelete = isAdmin || (currentUser && currentUser.id === suggestion.authorId);
  const [comment, setComment] = useState('');
  const [editingScores, setEditingScores] = useState(false);
  const [effortScore, setEffortScore] = useState(suggestion.effortScore);
  const [impactScore, setImpactScore] = useState(suggestion.impactScore);
  const [commentAnonymously, setCommentAnonymously] = useState(anonymousMode);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [activityExpanded, setActivityExpanded] = useState(false);
  
  // New state for comment editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  // State to track which comment has its menu open
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);
  
  // Update scores when suggestion changes
  useEffect(() => {
    setEffortScore(suggestion.effortScore);
    setImpactScore(suggestion.impactScore);
  }, [suggestion.effortScore, suggestion.impactScore]);
  
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      console.log('Submitting comment:', {
        suggestionId: suggestion.id,
        commentText: comment,
        isAnonymous: commentAnonymously,
        attachments: commentAttachments
      });
      onAddComment(comment, commentAnonymously, commentAttachments);
      setComment('');
      setCommentAttachments([]);
    }
  };
  
  const handleCommentFileUploaded = (fileInfo) => {
    console.log('Comment file uploaded:', fileInfo);
    setCommentAttachments([...commentAttachments, fileInfo]);
  };
  
  const handleRemoveCommentAttachment = (index) => {
    setCommentAttachments(commentAttachments.filter((_, i) => i !== index));
  };
  
  const handleSaveScores = () => {
    onUpdateScores(suggestion.id, effortScore, impactScore);
    setEditingScores(false);
  };
  
  const handleMerge = async (targetId, sourceId) => {
    try {
      setIsMerging(true);
      await onMergeSuggestions(targetId, sourceId);
      setMergeModalOpen(false);
    } catch (error) {
      console.error('Error merging suggestions:', error);
      alert('Failed to merge suggestions. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };
  
  const handleLikeComment = async (commentId) => {
    try {
      const updatedSuggestion = await apiService.likeComment(suggestion.id, commentId);
      // Don't use onAddComment for updating a suggestion after liking a comment
      // Instead, notify the parent of the updated suggestion directly
      if (typeof onCommentDeleted === 'function') {
        // Reuse onCommentDeleted since it's intended for updating a suggestion
        onCommentDeleted(updatedSuggestion);
      } else {
        // Fallback to using onAddComment but handle it as an update, not a new comment
        // Create a custom event or object to indicate this is just an update
        onAddComment(updatedSuggestion.id, null, false, [], true);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert('Failed to like the comment. Please try again.');
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    // Ask for confirmation before deleting
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      // Get the updated suggestion from the API
      const updatedSuggestion = await apiService.deleteComment(suggestion.id, commentId);
      console.log('Comment deleted, updated suggestion:', updatedSuggestion);
      
      // Pass the updated suggestion to the parent component
      if (typeof onCommentDeleted === 'function') {
        onCommentDeleted(updatedSuggestion);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete the comment. Please try again.');
    }
  };
  
  // New function to handle starting comment editing
  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
    setActiveCommentMenuId(null); // Close the menu when starting to edit
  };
  
  // New function to handle comment edit cancellation
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditedCommentText('');
  };
  
  // New function to handle comment edit submission
  const handleSaveEditComment = async (commentId) => {
    if (!editedCommentText.trim()) {
      alert('Comment text cannot be empty.');
      return;
    }
    
    try {
      const updatedSuggestion = await apiService.editComment(suggestion.id, commentId, editedCommentText);
      console.log('Comment edited, updated suggestion:', updatedSuggestion);
      
      // Pass the updated suggestion to the parent component
      if (typeof onCommentDeleted === 'function') {
        onCommentDeleted(updatedSuggestion);
      }
      
      // Reset editing state
      setEditingCommentId(null);
      setEditedCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit the comment. Please try again.');
    }
  };
  
  // Function to toggle comment menu
  const toggleCommentMenu = (commentId) => {
    setActiveCommentMenuId(activeCommentMenuId === commentId ? null : commentId);
  };
  
  // Close any open comment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeCommentMenuId && !event.target.closest('.comment-menu-container')) {
        setActiveCommentMenuId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeCommentMenuId]);

  // Update the comment section render
  return (
    <div className="max-w-xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        {/* back button and header */}
        <div className="flex items-center mb-4">
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 mr-2"
          >
            <ChevronLeft size={18} /> Back
          </button>
          <h2 className="text-xl font-medium flex-grow">{suggestion.title}</h2>
          
          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                {/* Menu options */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMergeModalOpen(true);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <GitMerge size={16} className="mr-2" />
                      Merge
                    </div>
                  </button>
                )}
                
                {isAdmin && (
                  <button
                    onClick={() => {
                      onLock(suggestion.id, !suggestion.isLocked);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Lock size={16} className="mr-2" />
                      {suggestion.isLocked ? 'Unlock' : 'Lock'}
                    </div>
                  </button>
                )}
                
                {isAdmin && (
                  <button
                    onClick={() => {
                      onPin(suggestion.id, !suggestion.isPinned);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Pin size={16} className="mr-2" />
                      {suggestion.isPinned ? 'Unpin' : 'Pin'}
                    </div>
                  </button>
                )}
                
                {canDelete && (
                  <button
                    onClick={() => {
                      onDelete(suggestion.id);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center">
                      <Trash size={16} className="mr-2" />
                      Delete
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Status</h4>
            {isAdmin ? (
              <select 
                className="block w-32 p-2 border rounded-md text-sm"
                value={suggestion.status}
                onChange={(e) => onUpdateStatus(suggestion.id, e.target.value)}
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Implemented">Implemented</option>
                <option value="Declined">Declined</option>
              </select>
            ) : (
              <div className="text-yellow-600 flex items-center">
                <span className="h-2 w-2 bg-yellow-600 rounded-full mr-1"></span> 
                {suggestion.status}
              </div>
            )}
            {/* Add these status indicators */}
            {suggestion.isLocked && (
              <div className="mt-1 text-gray-600 flex items-center text-sm">
                <Lock size={14} className="mr-1" /> Locked
              </div>
            )}
            {suggestion.isPinned && (
              <div className="mt-1 text-blue-600 flex items-center text-sm">
                <Pin size={14} className="mr-1" /> Pinned
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Department</h4>
            <div className="flex flex-wrap gap-1">
              {suggestion.departments && suggestion.departments.map(dept => (
                <span key={dept} className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                  {dept}
                </span>
              ))}
              {suggestion.departments && suggestion.departments.length === 0 && (
                <span className="text-gray-400 text-xs">None assigned</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm text-gray-500 mb-1">submitted by</h4>
            <div className="flex items-center">
              <div className={`h-6 w-6 min-w-6 ${suggestion.isAnonymous ? 'bg-gray-400' : 'bg-purple-500'} rounded-full flex items-center justify-center text-white mr-2 text-xs`}>
                {suggestion.authorInitial}
              </div>
              <span>{suggestion.author}</span>
              {suggestion.isAnonymous && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Anonymous</span>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <div className="md:col-span-3">
              <h4 className="text-sm text-gray-500 mb-1">Priority Calculation</h4>
              {editingScores ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">Effort (1-5, lower is easier)</label>
                    <select 
                      className="block w-48 p-2 border rounded-md text-sm" 
                      value={effortScore}
                      onChange={(e) => setEffortScore(parseInt(e.target.value))}
                    >
                      <option value="0">Not Rated</option>
                      <option value="1">1 - Very Easy</option>
                      <option value="2">2 - Easy</option>
                      <option value="3">3 - Medium</option>
                      <option value="4">4 - Hard</option>
                      <option value="5">5 - Very Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Impact (1-5, higher is better)</label>
                    <select 
                      className="block w-48 p-2 border rounded-md text-sm"
                      value={impactScore}
                      onChange={(e) => setImpactScore(parseInt(e.target.value))}
                    >
                      <option value="0">Not Rated</option>
                      <option value="1">1 - Minimal</option>
                      <option value="2">2 - Low</option>
                      <option value="3">3 - Medium</option>
                      <option value="4">4 - High</option>
                      <option value="5">5 - Transformative</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={handleSaveScores}
                    >
                      Save
                    </button>
                    <button 
                      className="border border-gray-300 px-3 py-1 rounded-md text-sm"
                      onClick={() => {
                        setEffortScore(suggestion.effortScore);
                        setImpactScore(suggestion.impactScore);
                        setEditingScores(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="text-sm">
                    <div>Effort: {suggestion.effortScore > 0 ? `${suggestion.effortScore}/5` : 'Not rated'}</div>
                    <div>Impact: {suggestion.impactScore > 0 ? `${suggestion.impactScore}/5` : 'Not rated'}</div>
                    <div className="font-medium">Priority Score: {suggestion.priorityScore > 0 ? suggestion.priorityScore : 'Not calculated'}</div>
                  </div>
                  <button 
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setEditingScores(true)}
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {suggestion.description}
          </p>
          
          {/* Display attachments if any */}
          {suggestion.attachments && suggestion.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm text-gray-500 mb-2 flex items-center">
                <Paperclip size={16} className="mr-1" /> Attachments
              </h4>
              <div className="space-y-2">
                {suggestion.attachments.map((attachment, index) => (
                  <Attachment key={index} attachment={attachment} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Comments section - now using the new format */}
        <div className="mt-8">
          <h3 className="font-medium mb-3 flex items-center">
            <MessageCircle size={18} className="mr-1" /> 
            Comments ({suggestion.comments ? suggestion.comments.length : 0})
          </h3>
          
          <div className="space-y-4">
            {suggestion.comments && suggestion.comments.map(comment => (
              <div key={comment.id} className={`flex gap-3 ${comment.isMergeDescription ? 'bg-indigo-50 p-3 rounded-md border border-indigo-100' : ''}`}>
                <div className={`h-8 w-8 min-w-8 ${comment.isAnonymous ? 'bg-gray-400' : comment.isMergeDescription ? 'bg-indigo-500' : 'bg-purple-500'} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                  {comment.authorInitial}
                </div>
                <div className="flex-grow">
                  {/* Editing form - shown when editing */}
                  {editingCommentId === comment.id ? (
                    <div className="mb-2">
                      <textarea 
                        value={editedCommentText}
                        onChange={(e) => setEditedCommentText(e.target.value)}
                        className="w-full border rounded-md p-2 text-gray-700 focus:border-indigo-500 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2 space-x-2">
                        <button 
                          onClick={handleCancelEditComment}
                          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEditComment(comment.id)}
                          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Comment text first */}
                      <p className={`${comment.isMergeDescription ? 'text-gray-800' : 'text-gray-700'}`}>
                        {comment.text}
                        {comment.editedTimestamp && <EditedLabel timestamp={comment.editedTimestamp} />}
                      </p>
                      
                      {/* Display comment attachments if any */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2">
                          {comment.attachments.map((attachment, idx) => (
                            <Attachment key={idx} attachment={attachment} />
                          ))}
                        </div>
                      )}
                      
                      {/* Comment metadata and actions in smaller grey font */}
                      <div className="flex items-center mt-1 text-gray-500 text-sm">
                        {/* Author name */}
                        <span className="font-medium text-gray-500">
                          {comment.author}
                        </span>
                        
                        {/* Special badges */}
                        {comment.isAnonymous && <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded ml-1">Anonymous</span>}
                        {comment.fromMerged && (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-1 rounded ml-1 flex items-center">
                            <GitMerge size={10} className="mr-1" /> Merged
                          </span>
                        )}
                        
                        {/* Timestamp */}
                        <span className="ml-2">{formatRelativeTime(comment.timestamp)}</span>
                        
                        {/* Like button */}
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className={`ml-3 flex items-center ${comment.likedBy && comment.likedBy.includes(currentUser?.id) ? 'text-red-500' : 'hover:text-red-500'}`}
                          aria-label="Like comment"
                        >
                          <Heart size={14} fill={comment.likedBy && comment.likedBy.includes(currentUser?.id) ? "currentColor" : "none"} />
                          <span className="ml-1">{comment.likes || 0}</span>
                        </button>
                        
                        {/* Three dots menu */}
                        <div className="relative ml-2 comment-menu-container">
                          <button 
                            onClick={() => toggleCommentMenu(comment.id)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Comment actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                          
                          {/* Dropdown menu */}
                          {activeCommentMenuId === comment.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-md z-10">
                              <ul className="py-1 text-xs">
                                {/* Edit option - only show if current user is comment author or admin */}
                                <li>
                                  <button 
                                    onClick={() => handleStartEditComment(comment)}
                                    className={`w-full text-left px-3 py-1 ${(isAdmin || (currentUser && comment.authorId === currentUser.id)) ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}`}
                                    disabled={!(isAdmin || (currentUser && comment.authorId === currentUser.id))}
                                  >
                                    <span className="flex items-center">
                                      <Edit3 size={12} className="mr-1" /> Edit
                                    </span>
                                  </button>
                                </li>
                                
                                {/* Delete option - only show if current user is comment author or admin */}
                                <li>
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className={`w-full text-left px-3 py-1 ${(isAdmin || (currentUser && comment.authorId === currentUser.id)) ? 'text-red-600 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}`}
                                    disabled={!(isAdmin || (currentUser && comment.authorId === currentUser.id))}
                                  >
                                    <span className="flex items-center">
                                      <Trash size={12} className="mr-1" /> Delete
                                    </span>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="flex gap-3 mt-4">
              <div className={`h-8 w-8 min-w-8 ${commentAnonymously ? 'bg-gray-400' : 'bg-green-500'} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                {commentAnonymously ? '?' : currentUser?.name?.[0] || 'U'}
              </div>
              <div className="flex-grow">
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={suggestion.isLocked ? "This suggestion is locked" : "Write a comment..."}
                  className="w-full border rounded-md p-2 focus:border-indigo-500 focus:outline-none text-gray-700"
                  rows={2}
                  disabled={suggestion.isLocked}
                ></textarea>
                  {/* Anonymous checkbox - commented out for now
                <div className="flex items-center justify-between mt-2">
                   <label className={`flex items-center text-sm ${suggestion.isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                     <input 
                       type="checkbox" 
                       className="mr-2"
                       checked={commentAnonymously}
                       onChange={() => setCommentAnonymously(!commentAnonymously)}
                       disabled={suggestion.isLocked}
                     />
                     Post anonymously
                   </label>
                </div>
                  */}
                <div className="flex items-center">
                  <label className={`cursor-pointer mr-2 ${suggestion.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Paperclip size={20} className="text-gray-500 hover:text-gray-700" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files.length === 0) return;
                        
                        const file = files[0];
                        
                        // Validate file size (max 20MB)
                        if (file.size > 20 * 1024 * 1024) {
                          alert('File size exceeds the maximum limit of 20MB');
                          return;
                        }
                        
                        try {
                          // Upload the file using the apiService
                          const result = await apiService.uploadFile(file);
                          
                          // Add the uploaded file to comment attachments
                          handleCommentFileUploaded(result);
                          
                          // Reset the input
                          e.target.value = null;
                        } catch (error) {
                          alert(error.message || 'Error uploading file');
                          console.error('Error uploading file:', error);
                        }
                      }}
                        

                    />
                  
                  </label>
                  
                  <div className="flex-grow"></div>
                  
                  <button 
                    type="submit" 
                    className={`px-4 py-1 rounded-md text-sm ${suggestion.isLocked || !comment.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    disabled={suggestion.isLocked || !comment.trim()}
                  >
                    Comment
                  </button>
                </div>
                
                {/* Display comment attachments */}
                {commentAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {commentAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center bg-gray-50 p-1 rounded">
                        <Paperclip size={14} className="mr-1 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate flex-grow">{attachment.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveCommentAttachment(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Merged suggestions section */}
        {suggestion.mergedWith && suggestion.mergedWith.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="font-medium mb-3 flex items-center">
              <GitMerge size={18} className="mr-1 text-indigo-600" /> 
              Merged Suggestions
            </h3>
            <div className="space-y-2">
              {suggestion.mergedWith.map(merged => (
                <div key={merged.id} className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                  <div className="font-medium">{merged.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Merged on {formatRelativeTime(merged.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity section */}
        <div className="mt-8">
          <h3 className="font-medium mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <Activity size={18} className="mr-1" /> 
              Activity
            </div>
            <button 
              onClick={() => setActivityExpanded(!activityExpanded)} 
              className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label={activityExpanded ? "Collapse activity" : "Expand activity"}
            >
              {activityExpanded ? "-" : "+"}
            </button>
          </h3>
          
          {activityExpanded && (
            <div className="space-y-3">
              {suggestion.activity && suggestion.activity.map(activity => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 flex-shrink-0">
                    {activity.authorInitial}
                  </div>
                  <div>
                    {activity.type === 'status' && (
                      <div>
                        <span className="font-medium">{activity.author}</span> changed status from{' '}
                        <span className="font-medium">{activity.from}</span> to{' '}
                        <span className="font-medium">{activity.to}</span>
                        <div className="text-gray-400 text-xs mt-1">{formatRelativeTime(activity.timestamp)}</div>
                      </div>
                    )}
                    {activity.type === 'merge' && (
                      <div>
                        <span className="font-medium">{activity.author}</span> merged suggestion{' '}
                        <span className="font-medium">{activity.sourceTitle}</span>{' '}
                        into this
                        <div className="text-gray-400 text-xs mt-1">{formatRelativeTime(activity.timestamp)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 text-sm">
                <div className={`h-6 w-6 ${suggestion.isAnonymous ? 'bg-gray-400' : 'bg-purple-500'} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                  {suggestion.authorInitial}
                </div>
                <div>
                  <span className="font-medium">{suggestion.author}</span> submitted
                  <div className="text-gray-400 text-xs mt-1">{formatDate(suggestion.timestamp)}</div>
                </div>
              </div>
            </div>
          )}
          
          {!activityExpanded && (
            <div className="text-sm text-gray-500">
              Activity history is collapsed. Click '+' to view.
            </div>
          )}
        </div>
      </div>
      
      {/* Merge Modal */}
      <MergeSuggestionModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        targetSuggestion={suggestion}
        availableSuggestions={allSuggestions}
        onMerge={handleMerge}
        isLoading={isMerging}
      />
    </div>
  );
};

export default SuggestionDetail;
