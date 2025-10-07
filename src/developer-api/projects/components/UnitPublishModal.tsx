import { useEffect, useMemo, useState } from 'react';
import developersApi, { Unit } from '../../../config/developers-api';

interface UnitPublishModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export default function UnitPublishModal({ projectId, isOpen, onClose, onPublished }: UnitPublishModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allUnits = await developersApi.units.list();
        const projectUnits = allUnits.filter(u => u.project === projectId);
        setUnits(projectUnits);
        // Default select all available units
        const defaults = new Set<number>(
          projectUnits.filter(u => u.status === 'available').map(u => u.id)
        );
        setSelectedIds(defaults);
      } catch (e: any) {
        setError(e?.message || 'Failed to load units');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId, isOpen]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allAvailableIds = useMemo(() => units.filter(u => u.status === 'available').map(u => u.id), [units]);
  const isAllSelected = selectedIds.size > 0 && allAvailableIds.every(id => selectedIds.has(id));

  const handleSelectAll = () => {
    setSelectedIds(new Set(allAvailableIds));
  };
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleFinalize = async () => {
    if (selectedIds.size === 0) {
      alert('Select at least one unit to publish.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // Publish selected units in parallel
      await Promise.all(Array.from(selectedIds).map(id => developersApi.units.publish(id)));
      // Publish the project itself
      await developersApi.projects.publish(projectId);
      onPublished();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Publishing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Units to Publish</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-sm text-slate-500">Loading units…</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-600">
                  {selectedIds.size} selected / {allAvailableIds.length} available
                </div>
                <div className="space-x-2">
                  <button onClick={handleSelectAll} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Select All</button>
                  <button onClick={handleDeselectAll} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Deselect All</button>
                </div>
              </div>

              <div className="max-h-72 overflow-auto border border-slate-200 rounded-xl divide-y">
                {units.map((u) => (
                  <label key={u.id} className={`flex items-center justify-between px-4 py-3 ${u.status !== 'available' ? 'bg-slate-50 opacity-60' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        disabled={u.status !== 'available'}
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{u.code} • {u.unit_type} • {u.bedrooms} bed</div>
                        <div className="text-slate-500">Status: {u.status}{u.price ? ` • €${Number(u.price).toLocaleString()}` : ''}</div>
                      </div>
                    </div>
                    {u.status === 'available' ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">available</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{u.status}</span>
                    )}
                  </label>
                ))}
                {units.length === 0 && (
                  <div className="p-4 text-sm text-slate-500">No units found for this project.</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">{isAllSelected ? 'All available units selected' : ''}</div>
          <div className="space-x-2">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleFinalize} disabled={isSubmitting || selectedIds.size === 0} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {isSubmitting ? 'Publishing…' : 'Finalize Publishing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}











































