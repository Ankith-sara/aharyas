import transporter from '../config/mailer.js';
import {
  B, emailHead, emailClose, brandHeader, brandFooter,
  sectionDivider, eyebrow, ctaButton, featureRow, statusBanner,
} from '../config/emailTemplates.js';

const sendWelcomeMail = async (email, name = 'Valued Customer') => {
  if (!email) {
    console.error('Missing email for welcome mail');
    return false;
  }

  const html = `
${emailHead('Welcome to Aharyas')}
${brandHeader()}

<!-- Hero — full-width black panel, mirrors the dark editorial sections -->
<tr>
  <td style="padding:64px 56px;background:${B.black};">
    <p style="margin:0 0 12px 0;font-size:9px;letter-spacing:5px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Welcome</p>
    <h2 style="margin:0 0 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;color:${B.white};letter-spacing:2px;line-height:1.25;">Hello, ${name}</h2>
    <div style="height:1px;background:${B.gray800};margin-bottom:28px;"></div>
    <p style="margin:0;font-size:13px;color:${B.gray400};line-height:2;max-width:420px;font-weight:400;">
      Your Aharyas account is now verified and ready. You are now part of a community that celebrates India's handcrafted heritage &mdash; where every thread carries a story.
    </p>
  </td>
</tr>

${statusBanner('Account Verified &amp; Active', true)}

${sectionDivider}

<!-- What awaits -->
<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('What Awaits You')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 24px;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${featureRow('Handcrafted Collections', 'Curated pieces from master artisans across India, made with centuries-old techniques.')}
      ${featureRow('Exclusive Member Access', 'Early access to new collections, limited drops, and member-only pricing.')}
      ${featureRow('Sustainable Luxury', 'Every purchase directly supports traditional crafts and sustainable artisan livelihoods.')}
      ${featureRow('Real-Time Order Tracking', 'End-to-end visibility on every order from dispatch to doorstep delivery.', true)}
    </table>
  </td>
</tr>

${sectionDivider}

<!-- CTA -->
<tr>
  <td style="padding:56px;text-align:center;">
    ${ctaButton(process.env.FRONTEND_URL || 'https://aharyas.com', 'Explore Collections')}
  </td>
</tr>

${sectionDivider}

<!-- Closing editorial quote — mirrors the border-l-2 blockquote in About.jsx -->
<tr>
  <td style="padding:56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="width:2px;background:${B.black};"></td>
        <td style="padding:6px 0 6px 24px;">
          <p style="margin:0 0 10px 0;font-family:Georgia,serif;font-size:16px;font-style:italic;color:${B.textMid};line-height:1.9;font-weight:400;">"Every thread tells a story, every piece carries a legacy."</p>
          <p style="margin:0;font-size:9px;color:${B.textFaint};letter-spacing:4px;text-transform:uppercase;">The Aharyas Team</p>
        </td>
      </tr>
    </table>
  </td>
</tr>

${brandFooter}
${emailClose}`;

  try {
    await transporter.sendMail({
      from: `"Aharyas" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to Aharyas, ${name}`,
      html,
    });
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    return false;
  }
};

export default sendWelcomeMail;