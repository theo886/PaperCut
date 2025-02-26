import React, { useState, useEffect } from 'react';
import { Edit, MessageCircle, Activity, GitMerge } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import MergeSuggestionModal from './MergeSuggestionModal';

const SuggestionDetail = ({ 
  suggestion, 
  isAdmin, 
  anonymousMode, 
  onBack, 
  onAddComment, 
  onUpdateStatus, 
  onUpdateScores,
  onMergeSuggestions,
  allSuggestions = []
}) => {
  const [comment, setComment] = useState('');
  const [editingScores, setEditingScores] = useState(false);
  const [effortScore, setEffortScore] = useState(suggestion.effortScore);
  const [impactScore, setImpactScore] = useState(suggestion.impactScore);
  const [commentAnonymously, setCommentAnonymously] = useState(anonymousMode);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  
  // Update scores when suggestion changes
  useEffect(() => {
    setEffortScore(suggestion.effortScore);
    setImpactScore(suggestion.impactScore);
  }, [suggestion.effortScore, suggestion.impactScore]);
  
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment, commentAnonymously);
      setComment('');
    }
  };
  
  const handleSaveScores = () => {
    onUpdateScores(effortScore, impactScore);
    setEditingScores(false);
  };
  
  const handleMerge = async (targetId, sourceId) => {
    try {
      setIsMerging(true);
      await onMergeSuggestions(targetId, sourceId);
      setMergeModalOpen(false);
    } catch (error) {
      console.error('Error merging suggestions:', error);
    } finally {
      setIsMerging(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 mr-2"
          >
            ← Back
          </button>
          <h2 className="text-xl font-medium flex-grow">{suggestion.title}</h2>
          
          {isAdmin && (
            <button
              onClick={() => setMergeModalOpen(true)}
              className="ml-4 text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
              title="Merge another suggestion into this one"
            >
              <GitMerge size={16} className="mr-1" /> Merge
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="text-sm text-gray-500 mb-1">Status</h4>
            {isAdmin ? (
              <select 
                className="block w-full p-2 border rounded-md text-sm"
                value={suggestion.status}
                onChange={(e) => onUpdateStatus(e.target.value)}
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
            <h4 className="text-sm text-gray-500 mb-1">Submitted by</h4>
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
                      className="block w-full p-2 border rounded-md text-sm" 
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
                      className="block w-full p-2 border rounded-md text-sm"
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
        </div>
        
        <div className="mt-8">
          <h3 className="font-medium mb-3 flex items-center">
            <MessageCircle size={18} className="mr-1" /> 
            Comments ({suggestion.comments ? suggestion.comments.length : 0})
          </h3>
          
          <div className="space-y-4">
            {suggestion.comments && suggestion.comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className={`h-8 w-8 min-w-8 ${comment.isAnonymous ? 'bg-gray-400' : 'bg-purple-500'} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                  {comment.authorInitial}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center flex-wrap">
                    <span className="font-medium">{comment.author}</span>
                    {comment.isAnonymous && <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded ml-2">Anonymous</span>}
                    {comment.fromMerged && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-1 rounded ml-2 flex items-center">
                        <GitMerge size={10} className="mr-1" /> From merged suggestion
                      </span>
                    )}
                    <span className="text-gray-400 text-sm ml-2">{formatDate(comment.timestamp)}</span>
                  </div>
                  <p className="text-gray-700 mt-1">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
            
            <form onSubmit={handleSubmitComment} className="flex gap-3 mt-4">
              <div className={`h-8 w-8 min-w-8 ${commentAnonymously ? 'bg-gray-400' : 'bg-green-500'} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                {commentAnonymously ? '?' : 'U'}
              </div>
              <div className="flex-grow">
                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  rows="2"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center text-sm text-gray-600">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={commentAnonymously}
                      onChange={() => setCommentAnonymously(!commentAnonymously)}
                    />
                    Post anonymously
                  </label>
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm"
                    disabled={!comment.trim()}
                  >
                    Comment
                  </button>
                </div>
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
                    Merged on {formatDate(merged.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity section */}
        <div className="mt-8">
          <h3 className="font-medium mb-3 flex items-center">
            <Activity size={18} className="mr-1" /> 
            Activity
          </h3>
          
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
                      <div className="text-gray-400 text-xs mt-1">{formatDate(activity.timestamp)}</div>
                    </div>
                  )}
                  {activity.type === 'merge' && (
                    <div>
                      <span className="font-medium">{activity.author}</span> merged suggestion{' '}
                      <span className="font-medium">{activity.sourceTitle}</span>{' '}
                      into this
                      <div className="text-gray-400 text-xs mt-1">{formatDate(activity.timestamp)}</div>
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
                <span className="font-medium">{suggestion.author}</span> created this idea
                <div className="text-gray-400 text-xs mt-1">{formatDate(suggestion.timestamp)}</div>
              </div>
            </div>
          </div>
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
