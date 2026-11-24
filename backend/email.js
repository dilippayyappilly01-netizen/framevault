async function sendLicenseReceiptEmail(config, license) {
  if (!config.resendApiKey || !license || !license.email) {
    return { sent: false, reason: 'email-not-configured' };
  }

  const email = String(license.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { sent: false, reason: 'invalid-email' };
  }

  const amount = `$${(Number(license.amountCents || config.licensePriceCents) / 100).toFixed(2)}`;
  const siteUrl = config.publicUrl || `http://localhost:${config.port}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
      <h2 style="margin: 0 0 12px;">Your FrameVault All-Access License</h2>
      <p style="margin: 0 0 16px; color: #4b5563;">
        Thank you for purchasing the FrameVault All-Access Component Library (${amount} one-time payment).
      </p>
      <div style="background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 6px;">License Key</div>
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px; font-weight: 700; color: #111827;">${license.licenseKey}</div>
      </div>
      <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px;">
        Keep this license key safe. If you switch browsers or devices, open <strong>${siteUrl}</strong>, click <strong>Get Access</strong>, and use <strong>Restore License</strong> with your email and key above.
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [email],
        subject: `Your FrameVault License Key: ${license.licenseKey}`,
        html
      })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { sent: false, reason: `resend-http-${res.status}`, detail: errBody.slice(0, 200) };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendLicenseReceiptEmail };
