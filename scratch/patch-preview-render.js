const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target = `              {commissionRatePreview && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>30-Day Total Orders: <strong>{commissionRatePreview.ordersCount}</strong></div>
                  <div>30-Day Gross GMV: <strong>₹{commissionRatePreview.grossGMV.toFixed(2)}</strong></div>
                  <div>Earnings at Old Rate ({commissionRatePreview.oldRate}%): <strong>₹{commissionRatePreview.oldEarnings.toFixed(2)}</strong></div>
                  <div>Earnings at New Rate ({commissionRatePreview.newRate}%): <strong style={{ color: 'var(--accent)' }}>₹{commissionRatePreview.newEarnings.toFixed(2)}</strong></div>
                  <div>Difference: <strong style={{ color: commissionRatePreview.diff >= 0 ? 'var(--accent)' : 'var(--danger)' }}>₹{commissionRatePreview.diff.toFixed(2)}</strong></div>
                </div>
              )}`;

const replacement = `              {commissionRatePreview && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {Number(commissionRatePreview.orders_count ?? commissionRatePreview.ordersCount ?? 0) === 0 ? (
                    <>
                      <div style={{ color: 'var(--text-muted)' }}>No delivered orders in the last 30 days</div>
                      <div>Earnings at Old Rate ({Number(commissionRatePreview.current_rate ?? commissionRatePreview.oldRate ?? 0).toFixed(2)}%): <strong>₹0.00</strong></div>
                      <div>Earnings at New Rate ({Number(commissionRatePreview.new_rate ?? commissionRatePreview.newRate ?? 0).toFixed(2)}%): <strong style={{ color: 'var(--accent)' }}>₹0.00</strong></div>
                      <div>Difference: <strong>₹0.00</strong></div>
                    </>
                  ) : (
                    <>
                      <div>30-Day Total Orders: <strong>{Number(commissionRatePreview.orders_count ?? commissionRatePreview.ordersCount ?? 0)}</strong></div>
                      <div>30-Day Gross GMV: <strong>₹{Number(commissionRatePreview.gross_gmv ?? commissionRatePreview.grossGMV ?? 0).toFixed(2)}</strong></div>
                      <div>Earnings at Old Rate ({Number(commissionRatePreview.current_rate ?? commissionRatePreview.oldRate ?? 0).toFixed(2)}%): <strong>₹{Number(commissionRatePreview.current_earnings_30d ?? commissionRatePreview.oldEarnings ?? 0).toFixed(2)}</strong></div>
                      <div>Earnings at New Rate ({Number(commissionRatePreview.new_rate ?? commissionRatePreview.newRate ?? 0).toFixed(2)}%): <strong style={{ color: 'var(--accent)' }}>₹{Number(commissionRatePreview.new_earnings_30d ?? commissionRatePreview.newEarnings ?? 0).toFixed(2)}</strong></div>
                      <div>Difference: <strong style={{ color: Number(commissionRatePreview.diff ?? 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>₹{Number(commissionRatePreview.diff ?? 0).toFixed(2)}</strong></div>
                    </>
                  )}
                </div>
              )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated commission preview rendering");
} else {
  const t = target.replace(/\n/g, '\r\n');
  const r = replacement.replace(/\n/g, '\r\n');
  if (code.includes(t)) {
    code = code.replace(t, r);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log("Updated commission preview rendering (CRLF)");
  } else {
    console.log("Could not find preview render block");
  }
}
