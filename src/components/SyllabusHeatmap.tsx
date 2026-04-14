import React from 'react';

export interface HeatmapChapter {
  id: string;
  subject: string;
  chapterName: string;
  daysSinceLastRevision: number | null;
}

interface SyllabusHeatmapProps {
  chapters: HeatmapChapter[];
}

const getColorClass = (days: number | null) => {
  if (days === null) return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'; // Not revised
  if (days === 0) return 'bg-emerald-500';
  if (days <= 3) return 'bg-emerald-600';
  if (days <= 7) return 'bg-emerald-700';
  if (days <= 14) return 'bg-emerald-800';
  return 'bg-slate-900 dark:bg-slate-950'; // 14+ days
};

export const SyllabusHeatmap: React.FC<SyllabusHeatmapProps> = ({ chapters }) => {
  const subjects = ['Physics', 'Chemistry', 'Mathematics'];

  return (
    <div className="w-full overflow-x-auto hide-scrollbar py-4">
      <div className="flex flex-col gap-6 min-w-max">
        {subjects.map(subject => {
          const subjectChapters = chapters.filter(c => c.subject === subject);
          if (subjectChapters.length === 0) return null;

          return (
            <div key={subject} className="flex items-center gap-4">
              <div className="w-24 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                {subject}
              </div>
              <div className="flex flex-wrap gap-1.5 max-w-[600px]">
                {subjectChapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className="group relative"
                  >
                    <div
                      className={`w-4 h-4 rounded-sm transition-colors duration-200 ${getColorClass(chapter.daysSinceLastRevision)}`}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      <div className="font-medium">{chapter.chapterName}</div>
                      <div className="text-gray-300">
                        {chapter.daysSinceLastRevision === null 
                          ? 'Not revised yet' 
                          : `${chapter.daysSinceLastRevision} day${chapter.daysSinceLastRevision === 1 ? '' : 's'} ago`}
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-6 text-xs text-gray-500 dark:text-gray-400">
        <span>Fresh</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-800" />
          <div className="w-3 h-3 rounded-sm bg-slate-900 dark:bg-slate-950" />
        </div>
        <span>Stale</span>
      </div>
    </div>
  );
};
