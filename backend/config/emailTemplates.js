// ─── BRAND DESIGN TOKENS ────────────────────────────────────────────────────────────
export const B = {
  black:       '#0a0a0a',
  blackSoft:   '#111111',
  charcoal:    '#1a1a1a',
  gray800:     '#2d2d2d',
  gray600:     '#4a4a4a',
  gray500:     '#6b6b6b',
  gray400:     '#9a9a9a',
  gray300:     '#c4c4c4',
  gray200:     '#e5e5e5',
  gray100:     '#f2f2f2',
  gray50:      '#f8f8f8',
  white:       '#ffffff',
  textDark:    '#0a0a0a',
  textMid:     '#4a4a4a',
  textLight:   '#9a9a9a',
  textFaint:   '#c4c4c4',
  green:       '#0a0a0a',
  greenLight:  '#f8f8f8',
  red:         '#0a0a0a',
  redLight:    '#f2f2f2',
  orange:      '#0a0a0a',
  orangeLight: '#f8f8f8',
  stone:       '#e5e5e5',
  creamDark:   '#f2f2f2',
  cream:       '#f8f8f8',
  goldDark:    '#0a0a0a',
  gold:        '#0a0a0a',
};

// emailHead
export const emailHead = (title) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${title} – Aharyas</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${B.gray100};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${B.gray100};">
  <tr><td align="center" style="padding:48px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="max-width:620px;width:100%;background:${B.white};border:1px solid ${B.gray200};">
`;

export const emailClose = `
    </table>
  </td></tr>
</table>
</body>
</html>
`;

// brandHeader 
export const brandHeader = () => `
  <tr><td style="height:2px;background:${B.black};"></td></tr>

  <tr>
    <td style="padding:48px 56px 44px;background:${B.white};border-bottom:1px solid ${B.gray200};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:bottom;">
            <p style="margin:0 0 10px 0;font-size:9px;letter-spacing:5px;color:${B.textLight};font-weight:400;text-transform:uppercase;">Est. 2025 &nbsp;&middot;&nbsp; Hyderabad</p>
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:400;letter-spacing:14px;color:${B.black};text-transform:uppercase;line-height:1;">AHARYAS</h1>
          </td>
          <td style="vertical-align:bottom;text-align:right;padding-bottom:2px;">
            <p style="margin:0;font-size:9px;letter-spacing:3px;color:${B.textFaint};text-transform:uppercase;font-weight:400;line-height:2.2;">Conscious Luxury<br/>Indian Heritage</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

// brandFooter 
export const brandFooter = `
  <tr><td style="height:1px;background:${B.gray200};"></td></tr>

  <tr>
    <td style="padding:44px 56px;background:${B.gray50};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="vertical-align:top;">
            <p style="margin:0 0 6px 0;font-family:Georgia,serif;font-size:12px;font-weight:400;letter-spacing:7px;color:${B.black};text-transform:uppercase;">AHARYAS</p>
            <p style="margin:0 0 22px 0;font-size:11px;color:${B.textLight};letter-spacing:0.5px;line-height:1.8;">Preserving heritage, one thread at a time.</p>
            <p style="margin:0 0 6px 0;"><a href="mailto:support@aharyas.com" style="font-size:11px;color:${B.textLight};text-decoration:none;">support@aharyas.com</a></p>
            <p style="margin:0;"><a href="tel:+919063284008" style="font-size:11px;color:${B.textLight};text-decoration:none;">+91 90632 84008</a></p>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <p style="margin:0 0 14px 0;font-size:9px;letter-spacing:3px;color:${B.textFaint};text-transform:uppercase;">Follow</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
              <tr>
                <td style="padding-left:12px;">
                  <a href="https://www.instagram.com/aharyas.in/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                    <img src="https://img.icons8.com/material-outlined/20/9a9a9a/instagram-new.png" alt="Instagram" width="20" height="20" style="display:block;border:0;width:20px;height:20px;" />
                  </a>
                </td>
                <td style="padding-left:12px;">
                  <a href="https://www.linkedin.com/in/aharyas-in-3a265633a/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                    <img src="https://img.icons8.com/material-outlined/20/9a9a9a/linkedin--v1.png" alt="LinkedIn" width="20" height="20" style="display:block;border:0;width:20px;height:20px;" />
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="height:1px;background:${B.gray200};margin:28px 0 22px;"></div>
      <p style="margin:0;font-size:10px;color:${B.textFaint};letter-spacing:1px;">&copy; ${new Date().getFullYear()} Aharyas. All rights reserved.</p>
    </td>
  </tr>

  <tr><td style="height:2px;background:${B.black};"></td></tr>
`;

// sectionDivider
export const sectionDivider = `
  <tr><td style="height:1px;background:${B.gray200};"></td></tr>
`;

// eyebrow label 
export const eyebrow = (text) =>
  `<p style="margin:0 0 10px 0;font-size:9px;letter-spacing:5px;color:${B.textLight};text-transform:uppercase;font-weight:400;">${text}</p>`;

// CTA buttons 
export const ctaButton = (href, label, bg = B.black, fg = B.white) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td style="background:${bg};border:1px solid ${bg};">
        <a href="${href}" style="display:block;padding:16px 52px;font-size:10px;font-weight:400;letter-spacing:4px;color:${fg};text-decoration:none;text-transform:uppercase;">${label}</a>
      </td>
    </tr>
  </table>
`;

export const outlineCtaButton = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td style="background:${B.white};border:1px solid ${B.black};">
        <a href="${href}" style="display:block;padding:15px 52px;font-size:10px;font-weight:400;letter-spacing:4px;color:${B.black};text-decoration:none;text-transform:uppercase;">${label}</a>
      </td>
    </tr>
  </table>
`;

// Alias — goldCtaButton now renders as primary black (keeps import compat)
export const goldCtaButton = (href, label) => ctaButton(href, label);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const formatINR = (amount) =>
  `&#8377;${Number(amount).toLocaleString('en-IN')}`;

// ─── Payment badge — monochrome ───────────────────────────────────────────────
export const paymentBadge = (method, isPaid) => {
  if (method === 'COD')
    return `<span style="display:inline-block;background:${B.black};color:${B.white};padding:5px 14px;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">Cash on Delivery</span>`;
  return isPaid
    ? `<span style="display:inline-block;background:${B.black};color:${B.white};padding:5px 14px;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">Paid Online</span>`
    : `<span style="display:inline-block;border:1px solid ${B.black};background:${B.white};color:${B.black};padding:5px 14px;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">Payment Pending</span>`;
};

export const statusBadge = (label, dark = true) =>
  dark
    ? `<span style="display:inline-block;background:${B.black};color:${B.white};padding:5px 14px;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">${label}</span>`
    : `<span style="display:inline-block;border:1px solid ${B.gray300};background:${B.white};color:${B.textMid};padding:5px 14px;font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;">${label}</span>`;

// ─── infoRow ──────────────────────────────────────────────────────────────────
export const infoRow = (label, value, lastRow = false) => `
  <tr${lastRow ? '' : ` style="border-bottom:1px solid ${B.gray200};"`}>
    <td style="padding:14px 0;font-size:9px;color:${B.textLight};font-weight:400;letter-spacing:3px;text-transform:uppercase;width:45%;">${label}</td>
    <td style="padding:14px 0;font-size:13px;color:${B.textDark};font-weight:400;text-align:right;">${value}</td>
  </tr>
`;

// ─── orderItemRow ─────────────────────────────────────────────────────────────
export const orderItemRow = (item, isLast = false) => {
  const linePrice   = formatINR(item.price * item.quantity);
  const origPrice   = item.originalPrice ? formatINR(item.originalPrice * item.quantity) : null;
  const hasDiscount = item.discount > 0 && origPrice;
  const imgSrc      = item.image || (item.images && item.images[0]) || '';

  return `
  <tr>
    <td style="padding:${isLast ? '0' : '0 0 1px 0'};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${B.gray200};">
        <tr>
          <td style="width:80px;vertical-align:top;border-right:1px solid ${B.gray200};background:${B.gray50};">
            ${imgSrc
              ? `<img src="${imgSrc}" alt="${item.name || 'Product'}" width="80" style="display:block;width:80px;height:80px;object-fit:cover;" />`
              : `<div style="width:80px;height:80px;background:${B.gray100};"></div>`
            }
          </td>
          <td style="padding:18px 22px;vertical-align:top;">
            <p style="margin:0 0 6px 0;font-family:Georgia,serif;font-size:14px;color:${B.textDark};font-weight:400;letter-spacing:0.5px;">${item.name || 'Handcrafted Product'}</p>
            <p style="margin:0 0 12px 0;font-size:9px;color:${B.textLight};letter-spacing:3px;text-transform:uppercase;">
              Qty &nbsp;${item.quantity}${item.size ? `&nbsp;&nbsp;&middot;&nbsp;&nbsp;${item.size}` : ''}
            </p>
            ${hasDiscount
              ? `<p style="margin:0;font-size:14px;color:${B.textDark};font-weight:400;">${linePrice}&nbsp;<span style="font-size:11px;color:${B.textFaint};text-decoration:line-through;margin-left:8px;">${origPrice}</span></p>`
              : `<p style="margin:0;font-size:14px;color:${B.textDark};font-weight:400;">${linePrice}</p>`
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;
};

// ─── addressBlock ─────────────────────────────────────────────────────────────
export const addressBlock = (address) => `
  <p style="margin:0;font-size:13px;color:${B.textDark};line-height:2.1;font-weight:400;">
    <strong style="font-weight:500;">${address.firstName || ''} ${address.lastName || ''}</strong><br/>
    ${address.street || ''}<br/>
    ${address.city || ''}, ${address.state || ''}&nbsp;${address.zipcode || ''}<br/>
    ${address.country || ''}<br/>
    <span style="color:${B.textLight};font-size:12px;">${address.phone || 'N/A'}</span>
  </p>
`;

// featureRow
export const featureRow = (title, desc, isLast = false) => `
  <tr>
    <td style="padding:${isLast ? '0' : '0 0 1px 0'};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="border:1px solid ${B.gray200};border-left:2px solid ${B.black};">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 5px 0;font-size:10px;font-weight:400;color:${B.textDark};letter-spacing:3px;text-transform:uppercase;">${title}</p>
            <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.8;font-weight:400;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

// stepRow
export const stepRow = (num, text, isLast = false) => `
  <tr>
    <td style="padding:${isLast ? '14px 0 0 0' : '14px 0'};${isLast ? '' : `border-bottom:1px solid ${B.gray200};`}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:22px;height:22px;background:${B.black};text-align:center;vertical-align:middle;font-size:10px;font-weight:400;color:${B.white};letter-spacing:0;line-height:22px;">${num}</td>
          <td style="padding-left:16px;font-size:13px;color:${B.textMid};line-height:1.7;font-weight:400;">${text}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

// otpBlock
export const otpBlock = (otp, subtitle = '') => `
  <tr>
    <td style="padding:0 56px 56px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:${B.black};border:1px solid ${B.black};">
        <tr>
          <td style="padding:52px 40px;text-align:center;">
            <p style="margin:0 0 10px 0;font-size:9px;letter-spacing:5px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Verification Code</p>
            ${subtitle ? `<p style="margin:0 0 36px 0;font-size:11px;color:${B.gray500};letter-spacing:1px;">${subtitle}</p>` : '<div style="height:36px;"></div>'}
            <div style="border:1px solid ${B.gray800};display:inline-block;padding:22px 40px;">
              <span style="font-family:'Courier New',Courier,monospace;font-size:42px;font-weight:400;color:${B.white};letter-spacing:22px;display:block;line-height:1;">${otp}</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

// noticeBlock
export const noticeBlock = (headline, body) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="border:1px solid ${B.gray200};border-left:2px solid ${B.black};background:${B.gray50};">
    <tr>
      <td style="padding:22px 24px;">
        ${headline ? `<p style="margin:0 0 7px 0;font-size:9px;font-weight:400;color:${B.textLight};letter-spacing:4px;text-transform:uppercase;">${headline}</p>` : ''}
        <p style="margin:0;font-size:13px;color:${B.textMid};line-height:1.8;font-weight:400;">${body}</p>
      </td>
    </tr>
  </table>
`;

// statusBanner
export const statusBanner = (label, dark = true) => `
  <tr>
    <td style="background:${dark ? B.black : B.gray100};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="width:2px;background:${dark ? B.gray800 : B.gray400};"></td>
          <td style="padding:15px 24px;font-size:9px;font-weight:400;letter-spacing:4px;color:${dark ? B.gray300 : B.black};text-transform:uppercase;">${label}</td>
        </tr>
      </table>
    </td>
  </tr>
`;