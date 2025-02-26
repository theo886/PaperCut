import React from 'react';
// Removed unused UserX import

const AnonymousToggle = ({ enabled, onChange }) => {
  return (
    <div className="flex items-center">
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${enabled ? 'bg-amber-500' : ''}`}></div>
      </label>
      <span className="ml-2 text-sm text-gray-700">Anonymous Mode</span>
    </div>
  );
};

export default AnonymousToggle;
