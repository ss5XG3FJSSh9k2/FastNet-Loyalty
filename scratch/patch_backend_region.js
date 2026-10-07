const fs = require('fs');

const backendFile = 'x:/app/backend/server.js';
let appCode = fs.readFileSync(backendFile, 'utf8');

const oldPostRoute = `app.post('/api/partner/regions', requireAuth, async (req, res) => {
  const session = await getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized or invalid session' });

  const { region_id, service_type } = req.body;
  if (!region_id || !service_type) {
    return res.status(400).json({ error: 'region_id and service_type are required' });
  }

  const partnerServiceTypes = session.partner.service_types || [];
  if (!partnerServiceTypes.includes(service_type)) {
    return res.status(400).json({ error: 'service_type not supported by partner' });
  }

  const regions = await db.getTable('regions');
  const regionExists = regions.some(r => r.id === region_id);
  if (!regionExists) {
    return res.status(400).json({ error: 'region_id does not exist' });
  }

  const partnerRegions = await db.getTable('partner_regions');
  const duplicate = partnerRegions.some(pr =>
    pr.partner_id === session.partnerId && pr.region_id === region_id && pr.service_type === service_type
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Region mapping already exists for this service_type' });
  }

  const newRow = {
    id: 'prg-' + generateId(),
    partner_id: session.partnerId,
    region_id,
    service_type,
    is_active: true,
    created_at: new Date().toISOString()
  };

  partnerRegions.push(newRow);
  await db.saveTable('partner_regions', partnerRegions);
  await appendAudit(req, 'PARTNER_REGION_ADD', 'partner_region', newRow.id, null, newRow, session.userId);

  return res.json(newRow);
});`;

const newPostRoute = `app.post('/api/partner/regions', requireAuth, async (req, res) => {
  const session = await getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized or invalid session' });

  const { region_id, service_type, service_types } = req.body;
  
  const typesToProcess = service_types ? service_types : (service_type ? [service_type] : []);

  if (!region_id || typesToProcess.length === 0) {
    return res.status(400).json({ error: 'region_id and service_types are required' });
  }

  const partnerServiceTypes = session.partner.service_types || [];
  for (const st of typesToProcess) {
    if (!partnerServiceTypes.includes(st)) {
      return res.status(400).json({ error: 'One or more service_types not supported by partner' });
    }
  }

  const regions = await db.getTable('regions');
  const regionExists = regions.some(r => r.id === region_id);
  if (!regionExists) {
    return res.status(400).json({ error: 'region_id does not exist' });
  }

  const partnerRegions = await db.getTable('partner_regions');
  
  const createdRows = [];
  const skippedTypes = [];

  for (const st of typesToProcess) {
    const duplicate = partnerRegions.some(pr =>
      pr.partner_id === session.partnerId && pr.region_id === region_id && pr.service_type === st
    );
    if (duplicate) {
      skippedTypes.push(st);
      continue;
    }
    
    const newRow = {
      id: 'prg-' + generateId(),
      partner_id: session.partnerId,
      region_id,
      service_type: st,
      is_active: true,
      created_at: new Date().toISOString()
    };
    createdRows.push(newRow);
  }

  if (createdRows.length === 0 && skippedTypes.length > 0) {
    return res.status(409).json({ error: 'Region mapping already exists for all provided service_types' });
  }

  if (createdRows.length > 0) {
    for (const newRow of createdRows) {
      partnerRegions.push(newRow);
    }
    await db.saveTable('partner_regions', partnerRegions);

    for (const newRow of createdRows) {
      await appendAudit(req, 'PARTNER_REGION_ADD', 'partner_region', newRow.id, null, newRow, session.userId);
    }
  }

  return res.json({
    created: createdRows,
    skipped: skippedTypes
  });
});`;

appCode = appCode.replace(oldPostRoute, newPostRoute);

fs.writeFileSync(backendFile, appCode);
console.log('Backend patch applied.');
