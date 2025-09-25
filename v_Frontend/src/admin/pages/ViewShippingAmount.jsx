import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../util';
import { Info, RefreshCcw, Edit3, Trash2, Save, X, CheckSquare } from 'lucide-react';

const ViewShippingAmount = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ pincode: '', amount: '', active: true });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/shipping/pincode`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setRows(data);
    } catch (err) {
      console.error('Failed to fetch shipping amounts', err);
      toast.error('Failed to load shipping amounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      pincode: String(row.pincode || ''),
      amount: String(row.amount ?? ''),
      active: row.active !== false
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ pincode: '', amount: '', active: true });
  };

  const saveRow = async (id) => {
    // validations
    if (!/^\d{6}$/.test(draft.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }
    const amt = Number(draft.amount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Amount must be a non-negative number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { pincode: draft.pincode, amount: amt, active: !!draft.active };
      const res = await axios.put(`${BASE_URL}/api/shipping/pincode/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success('Updated');
        cancelEdit();
        fetchData();
      } else {
        toast.error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exist')) {
        toast.error('Pincode already exists');
      } else {
        toast.error('Update failed');
      }
    }
  };

  const removeRow = async (id) => {
    if (!window.confirm('Delete this shipping rule?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/api/shipping/pincode/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">View/Manage Shipping Amounts</h1>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Review, edit, or delete shipping charges by pincode.</p>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>Click Edit to modify the pincode, amount, or set Active/Inactive.</li>
                <li>Click Save to apply changes or Cancel to discard them.</li>
                <li>Inactive entries are ignored during checkout.</li>
                <li>Use Refresh to reload the latest data.</li>
              </ul>
              <div className="mt-3 text-sm">
                <p className="font-medium">Row edit tooltips:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Pincode: Must be exactly 6 digits. Duplicates are not allowed.</li>
                  <li>Amount: Must be a non-negative number (₹).</li>
                  <li>Active: If unchecked, this pincode will not be charged at checkout.</li>
                </ul>
              </div>
            </div>
          </div>
        </div> */}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Pincode</th>
                <th className="py-2 pr-4">Amount (₹)</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-6" colSpan={4}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="py-6" colSpan={4}>No shipping rules found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="py-2 pr-4">
                    {editingId === row.id ? (
                      <input
                        type="text"
                        value={draft.pincode}
                        onChange={(e) => setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, '').slice(0,6) })}
                        className="px-2 py-1 border rounded w-32"
                        title="Pincode must be exactly 6 digits."
                      />
                    ) : (
                      <span>{row.pincode}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === row.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.amount}
                        onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                        className="px-2 py-1 border rounded w-28"
                        title="Amount must be non-negative."
                      />
                    ) : (
                      <span>{row.amount}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === row.id ? (
                      <label className="inline-flex items-center gap-2" title="If unchecked, this pincode will not be charged at checkout.">
                        <input
                          type="checkbox"
                          checked={!!draft.active}
                          onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                        />
                        <span>Active</span>
                      </label>
                    ) : (
                      <span className={`inline-flex items-center gap-1 ${row.active ? 'text-green-700' : 'text-gray-500'}`}>
                        <CheckSquare className="w-4 h-4" /> {row.active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === row.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveRow(row.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"><Save className="w-4 h-4" /> Save</button>
                        <button onClick={cancelEdit} className="inline-flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50"><X className="w-4 h-4" /> Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(row)} className="inline-flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50"><Edit3 className="w-4 h-4" /> Edit</button>
                        <button onClick={() => removeRow(row.id)} className="inline-flex items-center gap-1 px-3 py-1 rounded border text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewShippingAmount;
