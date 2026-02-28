import { useState, useEffect } from "react";
import { UserButton, useAuth } from "@clerk/clerk-react";

interface Monitor {
  _id: string;
  name: string;
  url: string;
  latestStatus: string;
  latestResponseTime: number | null;
  uptimePercentage: number;
}

interface Ping {
  _id: string;
  status: string;
  responseTime: number;
  checkedAt: string;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Ping history state
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [pings, setPings] = useState<Ping[]>([]);
  const [loadingPings, setLoadingPings] = useState(false);

  // We assume the Docker setup involves an Nginx proxy routing /api to the backend.
  // Otherwise, the fetches will naturally go to /api/monitors directly.
  const fetchMonitors = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/monitors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data);
      }
    } catch (error) {
      console.error("Failed to fetch monitors", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPings = async (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setLoadingPings(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/monitors/${monitor._id}/pings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPings(data);
      }
    } catch (error) {
      console.error("Failed to fetch pings", error);
    } finally {
      setLoadingPings(false);
    }
  };

  useEffect(() => {
    fetchMonitors();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitors, 30000);
    return () => clearInterval(interval);
  }, [getToken]); // Add getToken to dependencies to ensure it updates properly

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    try {
      const token = await getToken();
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, url }),
      });

      if (res.ok) {
        setName("");
        setUrl("");
        fetchMonitors();
      }
    } catch (error) {
      console.error("Failed to add monitor", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/monitors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchMonitors();
      }
    } catch (error) {
      console.error("Failed to delete monitor", error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between pb-6 mb-8 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          API Health Monitor
        </h1>
        <UserButton
          appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }}
        />
      </header>

      {/* Add new monitor form */}
      <form
        onSubmit={handleAddMonitor}
        className="flex flex-col sm:flex-row gap-4 mb-10 bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        <div className="flex-1 text-left">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Monitor Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g., Auth Service API"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex-1 text-left">
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            Endpoint URL
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/api"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!name || !url}
            className="h-[50px] w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Add Monitor
          </button>
        </div>
      </form>

      {/* Monitor List */}
      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          Your Monitors
          {!loading && (
            <span className="text-sm font-normal text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
              {monitors.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="text-center py-16 animate-pulse">
            <div className="text-gray-500 font-medium">
              Loading monitor statuses...
            </div>
          </div>
        ) : monitors.length === 0 ? (
          <div className="text-center bg-gray-900/50 border border-dashed border-gray-800 rounded-xl py-16">
            <div className="text-gray-400 text-lg mb-2">
              No monitors added yet.
            </div>
            <div className="text-gray-600 text-sm">
              Add your first URL above to start monitoring.
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {monitors.map((monitor) => (
              <div
                key={monitor._id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-lg font-semibold text-white truncate mb-1">
                    {monitor.name}
                  </h3>
                  <p className="text-gray-400 text-sm truncate bg-gray-950 border border-gray-800 py-1.5 px-3 rounded-lg inline-block max-w-full">
                    {monitor.url}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 md:gap-8 bg-gray-950/50 px-6 py-4 rounded-xl">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">
                      Status
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        monitor.latestStatus === "up"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : monitor.latestStatus === "down"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                      }`}
                    >
                      {monitor.latestStatus || "PENDING"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center min-w-[4rem]">
                    <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">
                      Uptime
                    </span>
                    <span className="font-mono font-medium text-lg">
                      {monitor.uptimePercentage || 0}%
                    </span>
                  </div>

                  <div className="flex flex-col items-center min-w-[5rem]">
                    <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">
                      Response
                    </span>
                    <span className="font-mono font-medium text-lg text-gray-300">
                      {monitor.latestResponseTime
                        ? `${monitor.latestResponseTime}ms`
                        : "---"}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => fetchPings(monitor)}
                    className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    aria-label="View history"
                    title="View ping history"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    History
                  </button>
                  <button
                    onClick={() => handleDelete(monitor._id)}
                    className="text-gray-600 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label="Delete"
                    title="Delete monitor"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pings Modal */}
      {selectedMonitor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-white">Ping History</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedMonitor.name} —{" "}
                  <span className="font-mono">{selectedMonitor.url}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedMonitor(null)}
                className="text-gray-500 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {loadingPings ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : pings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No pings recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pings.map((ping) => (
                    <div
                      key={ping._id}
                      className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            ping.status === "up"
                              ? "bg-green-500"
                              : ping.status === "down"
                                ? "bg-red-500"
                                : "bg-gray-500"
                          }`}
                        ></span>
                        <div className="flex flex-col">
                          <span className="text-white font-medium uppercase text-sm tracking-wider">
                            {ping.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(ping.checkedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-gray-300">
                          {ping.responseTime ? `${ping.responseTime}ms` : "---"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
