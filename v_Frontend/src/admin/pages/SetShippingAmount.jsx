import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../util';
import { Info, Save } from 'lucide-react';

const SetShippingAmount = () => {
  const [pincode, setPincode] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    const num = Number(amount);
    if (Number.isNaN(num) || num < 0) {
      toast.error('Please enter a non-negative amount');
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = { pincode, amount: Number(amount) };
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/api/shipping/pincode`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success('Shipping amount saved');
        setPincode('');
        setAmount('');
      } else {
        toast.error(res.data?.message || 'Failed to save');
      }
    } catch {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('exists')) {
        toast('Pincode already exists');
      } else {
        toast.error('Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border p-6">
        <h1 className="text-2xl font-bold mb-4">Set Shipping Amount</h1>

        {/* <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5" />
            {/* <div>
              <p className="font-medium">View/Manage Shipping, and Customer Checkout.</p>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>Add a delivery charge for a specific pincode.</li>
                <li>Enter a valid 6-digit pincode and a non-negative amount (₹).</li>
                <li>Click Save to create the rule.</li>
                <li>If a pincode is already configured, you’ll get a “Pincode already exists” message.</li>
                <li>This charge will be applied automatically at checkout when a customer enters the same pincode.</li>
              </ul>
            </div> 
          </div>
        </div> */}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
              <span
                className="ml-2 text-gray-400 cursor-help"
                title="Enter a valid 6-digit pincode. Only digits are allowed."
              >
                (?)
              </span>
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              placeholder="e.g. 560001"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
              <span
                className="ml-2 text-gray-400 cursor-help"
                title="Enter a non-negative shipping amount in rupees. Example: 49 or 59.99."
              >
                (?)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              placeholder="e.g. 59 or 59.99"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetShippingAmount;
