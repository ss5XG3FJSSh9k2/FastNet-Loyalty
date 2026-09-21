const fs = require('fs');

let text = fs.readFileSync('frontend/src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

const replacements = [
    [
        `            const pData = await pRes.json().catch(() => ({}));\n            setStockistProfile(pData);`,
        `            const pData = await pRes.json().catch(() => ({}));\n            setStockistProfile({
              ...pData,
              prep_eta_minutes: pData.prep_eta_minutes ?? 15,
              delivery_radius_km: pData.delivery_radius_km ?? 5.0,
              opening_time: pData.opening_time || '09:00',
              closing_time: pData.closing_time || '17:00'
            });`
    ],
    [
        `      const pData = await pRes.json().catch(() => ({}));\n      setStockistProfile(pData);`,
        `      const pData = await pRes.json().catch(() => ({}));\n      setStockistProfile({
        ...pData,
        prep_eta_minutes: pData.prep_eta_minutes ?? 15,
        delivery_radius_km: pData.delivery_radius_km ?? 5.0,
        opening_time: pData.opening_time || '09:00',
        closing_time: pData.closing_time || '17:00'
      });`
    ],
    [
        `                                 opening_time: stockistProfile.opening_time,
                                 closing_time: stockistProfile.closing_time,
                                 prep_eta_minutes: stockistProfile.prep_eta_minutes,
                                 delivery_radius_km: stockistProfile.delivery_radius_km,`,
        `                                 opening_time: stockistProfile.opening_time || '09:00',
                                 closing_time: stockistProfile.closing_time || '17:00',
                                 prep_eta_minutes: stockistProfile.prep_eta_minutes || 15,
                                 delivery_radius_km: stockistProfile.delivery_radius_km || 5.0,`
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
