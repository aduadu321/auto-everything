import { useState, useEffect } from "react";
import { Car, AlertTriangle, CheckCircle, Clock, Search, RefreshCw } from "lucide-react";

interface ItpVehicle {
  plateNumber: string;
  make: string;
  model: string;
  year: number | null;
  owner: string | null;
  phone: string | null;
  itpIssueDate: string | null;
  itpExpiryDate: string | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  source: string;
}

interface ItpStatusResponse {
  total: number;
  expired: number;
  expiringSoon: number;
  valid: number;
  vehicles: ItpVehicle[];
}

export function ItpStatusPage() {
  const [data, setData] = useState<ItpStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "expired" | "expiring" | "valid">("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments/itp-status");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading ITP status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredVehicles = data?.vehicles.filter((v) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || v.plateNumber.toLowerCase().includes(searchLower) || v.owner?.toLowerCase().includes(searchLower) || v.phone?.includes(search);
    let matchesStatus = true;
    if (filter === "expired") matchesStatus = v.isExpired;
    else if (filter === "expiring") matchesStatus = v.isExpiringSoon;
    else if (filter === "valid") matchesStatus = !v.isExpired && !v.isExpiringSoon && v.daysUntilExpiry !== null;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Status ITP Vehicule</h1>
          <p className="text-gray-500">Monitorizare expirare ITP pentru toate vehiculele</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          Reincarca
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Vehicule</p><p className="text-2xl font-bold text-gray-800">{data.total}</p></div>
              <Car className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">ITP Expirat</p><p className="text-2xl font-bold text-red-600">{data.expired}</p></div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Expira in 30 zile</p><p className="text-2xl font-bold text-yellow-600">{data.expiringSoon}</p></div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">ITP Valabil</p><p className="text-2xl font-bold text-green-600">{data.valid}</p></div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cauta dupa nr. inmatriculare, proprietar sau telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            {(["all", "expired", "expiring", "valid"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg transition-colors ${filter === f ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {f === "all" && "Toate"}{f === "expired" && "Expirate"}{f === "expiring" && "Expira curand"}{f === "valid" && "Valabile"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nr. Inmatriculare</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicul</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Proprietar</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Telefon</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data ITP</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Expirare ITP</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500"><RefreshCw className="animate-spin mx-auto mb-2" size={24} />Se incarca...</td></tr>
            ) : filteredVehicles.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nu exista vehicule care sa corespunda criteriilor.</td></tr>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className="font-mono font-bold text-gray-800">{vehicle.plateNumber}</span></td>
                  <td className="px-4 py-3 text-gray-600">{vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}</td>
                  <td className="px-4 py-3 text-gray-600">{vehicle.owner || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{vehicle.phone || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(vehicle.itpIssueDate)}</td>
                  <td className="px-4 py-3 font-medium"><span className={vehicle.isExpired ? "text-red-600" : vehicle.isExpiringSoon ? "text-yellow-600" : "text-gray-800"}>{formatDate(vehicle.itpExpiryDate)}</span></td>
                  <td className="px-4 py-3">
                    {vehicle.isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertTriangle size={12} /> Expirat</span>
                    ) : vehicle.isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock size={12} /> {vehicle.daysUntilExpiry} zile</span>
                    ) : vehicle.daysUntilExpiry !== null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={12} /> Valabil</span>
                    ) : (<span className="text-gray-400">-</span>)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
