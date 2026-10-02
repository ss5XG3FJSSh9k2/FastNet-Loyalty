const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const targetPost = `app.post('/api/admin/generic-rewards', async (req, res) => {
  const { name, description, point_cost, value_rupees, cooldown_type, cooldown_days, valid_until, min_order_value } = req.body;
  if (!name || !point_cost) return res.status(400).json({ error: 'Missing fields' });
  if (!['NONE', 'DAYS', 'ONCE'].includes(cooldown_type)) return res.status(400).json({ error: 'Invalid cooldown_type' });`;

const replacementPost = `app.post('/api/admin/generic-rewards', async (req, res) => {
  const { name, description, point_cost, value_rupees, cooldown_type, cooldown_days, valid_until, min_order_value } = req.body;
  
  if (name === undefined || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > cfg.REWARD_NAME_MAX_LENGTH) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: 'Must be 1-' + cfg.REWARD_NAME_MAX_LENGTH + ' chars' } });
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > cfg.REWARD_DESCRIPTION_MAX_LENGTH)) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid description', fields: { description: 'Too long' } });
  }
  if (point_cost === undefined || !/^\\d+$/.test(String(point_cost))) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid point_cost', fields: { point_cost: 'Must be numeric string or int' } });
  }
  const pc = parseInt(point_cost, 10);
  if (pc < 1 || pc > cfg.REWARD_POINT_COST_MAX) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid point_cost', fields: { point_cost: 'Must be 1-' + cfg.REWARD_POINT_COST_MAX } });
  }
  const vr = parseFloat(value_rupees);
  if (value_rupees === undefined || isNaN(vr) || !Number.isFinite(vr) || vr < 0 || vr > cfg.REWARD_VALUE_MAX_RUPEES) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid value_rupees', fields: { value_rupees: 'Must be 0-' + cfg.REWARD_VALUE_MAX_RUPEES } });
  }

  if (!['NONE', 'DAYS', 'ONCE'].includes(cooldown_type)) return res.status(400).json({ error: 'Invalid cooldown_type' });`;

const targetPatch = `app.patch('/api/admin/generic-rewards/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, point_cost, value_rupees, is_active, cooldown_type, cooldown_days, valid_until, min_order_value } = req.body;
  const rewards = await db.getTable('generic_rewards');
  const reward = rewards.find(r => r.id === id);
  if (!reward) return res.status(404).json({ error: 'Not found' });

  if (name !== undefined) reward.name = name;
  if (description !== undefined) reward.description = description;
  if (point_cost !== undefined) reward.point_cost = parseInt(point_cost, 10);
  if (value_rupees !== undefined) reward.value_rupees = parseFloat(value_rupees);
  if (is_active !== undefined) reward.is_active = is_active;`;

const replacementPatch = `app.patch('/api/admin/generic-rewards/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, point_cost, value_rupees, is_active, cooldown_type, cooldown_days, valid_until, min_order_value } = req.body;
  const rewards = await db.getTable('generic_rewards');
  const reward = rewards.find(r => r.id === id);
  if (!reward) return res.status(404).json({ error: 'Not found' });

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > cfg.REWARD_NAME_MAX_LENGTH) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: 'Must be 1-' + cfg.REWARD_NAME_MAX_LENGTH + ' chars' } });
    }
    reward.name = name.trim();
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > cfg.REWARD_DESCRIPTION_MAX_LENGTH) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid description', fields: { description: 'Too long' } });
    }
    reward.description = description;
  }
  if (point_cost !== undefined) {
    if (!/^\\d+$/.test(String(point_cost))) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid point_cost', fields: { point_cost: 'Must be numeric string or int' } });
    }
    const pc = parseInt(point_cost, 10);
    if (pc < 1 || pc > cfg.REWARD_POINT_COST_MAX) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid point_cost', fields: { point_cost: 'Must be 1-' + cfg.REWARD_POINT_COST_MAX } });
    }
    reward.point_cost = pc;
  }
  if (value_rupees !== undefined) {
    const vr = parseFloat(value_rupees);
    if (isNaN(vr) || !Number.isFinite(vr) || vr < 0 || vr > cfg.REWARD_VALUE_MAX_RUPEES) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid value_rupees', fields: { value_rupees: 'Must be 0-' + cfg.REWARD_VALUE_MAX_RUPEES } });
    }
    reward.value_rupees = vr;
  }
  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid is_active', fields: { is_active: 'Must be boolean' } });
    }
    reward.is_active = is_active;
  }`;

const targetPost2 = `    name,
    description: description || null,
    point_cost: parseInt(point_cost, 10),
    value_rupees: parseFloat(value_rupees) || 0,
    is_active: true,`;

const replacementPost2 = `    name: name.trim(),
    description: description || null,
    point_cost: pc,
    value_rupees: vr,
    is_active: true,`;

code = code.replace(targetPost, replacementPost);
code = code.replace(targetPatch, replacementPatch);
code = code.replace(targetPost2, replacementPost2);
fs.writeFileSync('backend/server.js', code, 'utf8');
