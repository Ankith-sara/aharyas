import transporter from '../config/mailer.js';
import {
  B, emailHead, emailClose, brandHeader, brandFooter,
  sectionDivider, eyebrow, ctaButton, featureRow, statusBanner,
} from '../config/emailTemplates.js';

const sendNewsletterMail = async (email) => {
  if (!email) {
    console.error('Missing email for newsletter subscription');
    return false;
  }

  const whatsappLink = process.env.WHATSAPP_GROUP_LINK;
  const unsubscribeLink = `${process.env.FRONTEND_URL || 'https://aharyas.com'}/unsubscribe?email=${encodeURIComponent(email)}`;
  const privacyLink = `${process.env.FRONTEND_URL || 'https://aharyas.com'}/privacy`;

  const html = `
${emailHead('Welcome to the Aharyas Community')}
${brandHeader()}

<!-- Hero -->
<tr>
  <td style="padding:64px 56px;background:${B.black};">
    <p style="margin:0 0 12px 0;font-size:9px;letter-spacing:5px;color:${B.gray400};text-transform:uppercase;font-weight:400;">You're In</p>
    <h2 style="margin:0 0 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;color:${B.white};letter-spacing:2px;line-height:1.25;">Welcome to Our Community</h2>
    <div style="height:1px;background:${B.gray800};margin-bottom:28px;"></div>
    <p style="margin:0;font-size:13px;color:${B.gray400};line-height:2;max-width:420px;font-weight:400;">
      You have joined a circle of conscious fashion lovers who believe in heritage, craft, and sustainability. Expect curated stories, exclusive access, and artisan-first updates.
    </p>
  </td>
</tr>

${statusBanner('Subscription Confirmed', true)}

${sectionDivider}

<!-- Benefits -->
<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('What You\'ll Receive')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 24px;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${featureRow('Exclusive Collection Drops', 'First access to new collections before they go live to the public.')}
      ${featureRow('Artisan Stories', 'Behind-the-scenes glimpses into our makers and their time-honoured crafts.')}
      ${featureRow('Sustainability Updates', 'Stories about our eco-conscious practices and community impact.')}
      ${featureRow('Member-Only Offers', 'Subscriber discounts and early-bird pricing on every new launch.', true)}
    </table>
  </td>
</tr>

${sectionDivider}

${whatsappLink ? `
<!-- WhatsApp -->
<tr>
  <td style="padding:56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:${B.black};border:1px solid ${B.black};">
      <tr>
        <td style="padding:40px 40px;">
          <p style="margin:0 0 10px 0;font-size:9px;letter-spacing:5px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Community</p>
          <h3 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:20px;font-weight:400;color:${B.white};letter-spacing:1px;">Join Our WhatsApp Group</h3>
          <div style="height:1px;background:${B.gray800};margin-bottom:18px;"></div>
          <p style="margin:0 0 28px 0;font-size:13px;color:${B.gray400};line-height:1.9;font-weight:400;">Exclusive drops, artisan stories, behind-the-scenes content, and member-only offers &mdash; all in one place.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${B.white};border:1px solid ${B.white};">
                <a href="${whatsappLink}" style="display:block;padding:14px 40px;font-size:10px;font-weight:400;letter-spacing:4px;color:${B.black};text-decoration:none;text-transform:uppercase;">Join the Group</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
${sectionDivider}` : ''}

<!-- CTA -->
<tr>
  <td style="padding:56px;text-align:center;">
    ${ctaButton(process.env.FRONTEND_URL || 'https://aharyas.com', 'Explore Collections')}
  </td>
</tr>

${sectionDivider}

${brandFooter}

<!-- Legal unsubscribe -->
<tr>
  <td style="padding:18px 56px;background:${B.gray50};border-top:1px solid ${B.gray200};">
    <p style="margin:0;font-size:10px;color:${B.textFaint};letter-spacing:0.5px;">
      You're receiving this because you subscribed to Aharyas updates. &nbsp;
      <a href="${unsubscribeLink}" style="color:${B.textFaint};text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp;
      <a href="${privacyLink}" style="color:${B.textFaint};text-decoration:underline;">Privacy Policy</a>
    </p>
  </td>
</tr>
${emailClose}`;

  try {
    await transporter.sendMail({
      from: `"Aharyas" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to the Aharyas Community',
      html,
    });
    console.log(`Newsletter welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send newsletter email:', error.message);
    return false;
  }
};

export default sendNewsletterMail;