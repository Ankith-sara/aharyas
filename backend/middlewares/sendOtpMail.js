import transporter from '../config/mailer.js';
import {
  B, emailHead, emailClose, brandHeader, brandFooter,
  sectionDivider, eyebrow, stepRow, noticeBlock, otpBlock,
} from '../config/emailTemplates.js';

const sendOtpMail = async (email, otp, role = 'user') => {
  if (!email || !otp) {
    console.error('Missing email or OTP for verification mail');
    return false;
  }

  const isAdmin = role === 'admin';

  const html = `
${emailHead('Email Verification')}
${brandHeader()}

<!-- Heading block -->
<tr>
  <td style="padding:56px 56px 48px;background:${B.white};">
    ${eyebrow(isAdmin ? 'Admin Portal' : 'Account')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${B.black};letter-spacing:1px;line-height:1.2;">
      ${isAdmin ? 'Administrator Verification' : 'Verify Your Email'}
    </h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;max-width:440px;font-weight:400;">
      ${isAdmin
      ? 'Use the code below to complete administrator portal access. This code is time-sensitive and must not be shared with anyone.'
      : 'Enter this code on the registration page to activate your Aharyas account. The code expires in 5 minutes.'
    }
    </p>
  </td>
</tr>

${sectionDivider}

${otpBlock(otp, 'Valid for 5 minutes only')}

${sectionDivider}

<!-- How to verify -->
<tr>
  <td style="padding:48px 56px;">
    ${eyebrow('How To Verify')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${stepRow(1, `Return to the ${isAdmin ? 'admin ' : ''}registration page`)}
      ${stepRow(2, 'Enter the 6-digit code shown above')}
      ${stepRow(3, 'Click "Verify &amp; Continue" to activate your account', true)}
    </table>
  </td>
</tr>

${sectionDivider}

${isAdmin ? `
<!-- Admin warning -->
<tr>
  <td style="padding:48px 56px;">
    ${noticeBlock('Admin Access', 'This code grants administrative access to the Aharyas platform. Only authorised personnel should complete this verification. If you did not request this, contact us immediately at support@aharyas.com.')}
  </td>
</tr>
${sectionDivider}` : ''}

<!-- Security reminder -->
<tr>
  <td style="padding:48px 56px;">
    ${noticeBlock('Security Reminder', 'Never share this code with anyone &mdash; Aharyas will never ask for it &mdash; Valid for 5 minutes only.')}
  </td>
</tr>

${brandFooter}
${emailClose}`;

  try {
    await transporter.sendMail({
      from: `"Aharyas" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isAdmin ? 'Admin Verification Code – Aharyas' : 'Your Verification Code – Aharyas',
      html,
    });
    console.log(`OTP email sent to ${email} (${role})`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    return false;
  }
};

export default sendOtpMail;