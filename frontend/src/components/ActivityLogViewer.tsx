import { useEffect, useMemo, useState } from 'react';
import { fetchActivityLogs, type ActivityLog } from '../services/adminService.ts';
import Pagination from './Pagination.tsx';
import { useDebounce } from '../hooks/useDebounce.ts';

export default function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [user, setUser] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const filterValues = useMemo(() => ({ action, resource, user }), [action, resource, user]);
  const debouncedFilters = useDebounce(filterValues, 300);

  useEffect(() => {
    setLoading(true);
    fetchActivityLogs(page, 20, {
      action: debouncedFilters.action || undefined,
      resource: debouncedFilters.resource || undefined,
      user: debouncedFilters.user || undefined,
    })
      .then((res) => {
        setLogs(res.data.logs);
        setPages(res.data.pages || 1);
      })
      .catch(() => {
        setLogs([]);
        setPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedFilters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Nhật ký hoạt động</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Tên hoặc email user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-gray-700">Thời gian</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-gray-700">Người dùng</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-gray-700">Hành động</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-gray-700">Resource</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium text-gray-700 hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">{log.user.name}</p>
                      <p className="text-xs text-gray-500">{log.user.email}</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-gray-800 text-xs sm:text-sm">{log.action}</td>
                  <td className="px-3 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">{log.resource}</td>
                  <td className="px-3 sm:px-4 py-3 text-gray-500 text-xs sm:text-sm hidden md:table-cell">{log.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
