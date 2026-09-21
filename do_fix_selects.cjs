const fs = require('fs');
let text = fs.readFileSync('frontend/src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

const replacements = [
    [
        `setProfileCablePartnerId(data.bindings.cable_partner_id);`,
        `setProfileCablePartnerId(data.bindings.cable_partner_id || '');`
    ],
    [
        `setProfileBroadbandPartnerId(data.bindings.broadband_partner_id);`,
        `setProfileBroadbandPartnerId(data.bindings.broadband_partner_id || '');`
    ],
    [
        `value={profileNoCable ? 'NOT_LISTED' : profileCablePartnerId}`,
        `value={profileNoCable ? 'NOT_LISTED' : (profileCablePartnerId || '')}`
    ],
    [
        `value={profileNoBroadband ? 'NOT_LISTED' : profileBroadbandPartnerId}`,
        `value={profileNoBroadband ? 'NOT_LISTED' : (profileBroadbandPartnerId || '')}`
    ],
    [
        `<select className="text-input" value={selectedRegionId} onChange={e => setSelectedRegionId(e.target.value)}>`,
        `<select className="text-input" value={selectedRegionId || ''} onChange={e => setSelectedRegionId(e.target.value)}>`
    ],
    [
        `<select className="text-input" value={editingVendorRegionId} onChange={e => setEditingVendorRegionId(e.target.value)}>`,
        `<select className="text-input" value={editingVendorRegionId || ''} onChange={e => setEditingVendorRegionId(e.target.value)}>`
    ]
];

for (let [orig, repl] of replacements) {
    if (!text.includes(orig)) {
        console.error('COULD NOT FIND MATCH FOR:', orig);
    } else {
        text = text.replace(orig, repl);
    }
}

fs.writeFileSync('frontend/src/App.jsx', text);
console.log('Replacements completed.');
