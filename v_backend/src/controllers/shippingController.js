'use strict';

const { shippingpincode } = require('../models');

// Basic helpers
const isValidPincode = (p) => /^\d{6}$/.test(String(p || '').trim());

module.exports = {
  // POST /api/shipping/pincode
  async create(req, res) {
    try {
      const { pincode, amount, is_active = true } = req.body;

      if (!isValidPincode(pincode)) {
        return res.status(400).json({ message: 'Invalid pincode. It must be exactly 6 digits.' });
      }
      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        return res.status(400).json({ message: 'Amount must be a numeric value.' });
      }

      const existing = await shippingpincode.findOne({ where: { pincode: String(pincode).trim() } });
      if (existing) {
        return res.status(409).json({ message: 'Pincode already exists.' });
      }

      const created = await shippingpincode.create({
        pincode: String(pincode).trim(),
        amount: Number(amount),
        is_active: Boolean(is_active)
      });

      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Create shipping pincode error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // GET /api/shipping/pincode?pin=XXXXXX or /api/shipping/pincode for all
  async list(req, res) {
    try {
      const { pin, active } = req.query;
      const where = {};

      if (active === 'true') where.is_active = true;
      if (active === 'false') where.is_active = false;

      // If pincode is provided, return single rule or empty array
      if (pin) {
        if (!isValidPincode(pin)) {
          return res.status(400).json({ message: 'Invalid pincode.' });
        }
        const row = await shippingpincode.findOne({
          where: { ...where, pincode: String(pin).trim() }
        });
        if (!row) return res.json({ data: [] });
        return res.json({ data: [row] });
      }

      // Return all rules
      const rows = await shippingpincode.findAll({
        where,
        order: [['pincode', 'ASC']]
      });
      return res.json({ data: rows });
    } catch (err) {
      console.error('List shipping pincode error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // PUT /api/shipping/pincode/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { pincode, amount, is_active } = req.body;

      const row = await shippingpincode.findByPk(id);
      if (!row) return res.status(404).json({ message: 'Entry not found' });

      if (pincode !== undefined) {
        if (!isValidPincode(pincode)) {
          return res.status(400).json({ message: 'Invalid pincode. It must be exactly 6 digits.' });
        }
        // check duplicate if pincode changed
        if (String(pincode).trim() !== row.pincode) {
          const dupe = await shippingpincode.findOne({ where: { pincode: String(pincode).trim() } });
          if (dupe) return res.status(409).json({ message: 'Another entry with this pincode already exists.' });
        }
        row.pincode = String(pincode).trim();
      }

      if (amount !== undefined) {
        if (amount === null || isNaN(Number(amount))) {
          return res.status(400).json({ message: 'Amount must be a numeric value.' });
        }
        row.amount = Number(amount);
      }

      if (is_active !== undefined) {
        row.is_active = Boolean(is_active);
      }

      await row.save();
      return res.json({ success: true });
    } catch (err) {
      console.error('Update shipping pincode error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // DELETE /api/shipping/:id
  async remove(req, res) {
    try {
      const { id } = req.params;
      const row = await shippingpincode.findByPk(id);
      if (!row) return res.status(404).json({ message: 'Entry not found' });
      await row.destroy();
      return res.json({ success: true });
    } catch (err) {
      console.error('Delete shipping pincode error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};
