import transporter from '../config/mailer.js';
import productModel from '../models/ProductModel.js';
import {
  B, emailHead, emailClose, brandHeader, brandFooter,
  sectionDivider, eyebrow, ctaButton, outlineCtaButton,
  formatDate, formatINR, paymentBadge, infoRow,
  orderItemRow, addressBlock, noticeBlock, otpBlock,
  stepRow, statusBanner,
} from '../config/emailTemplates.js';

// ─── Core send helper ─────────────────────────────────────────────────────────
const sendOrderMail = async (email, subject, html) => {
  if (!email || !subject) {
    console.error('Missing email or subject for order mail');
    return false;
  }
  try {
    const info = await transporter.sendMail({
      from: `"Aharyas" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`Order email sent to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Error sending order email to ${email}:`, error.message);
    return false;
  }
};

// ─── Order Confirmation (Customer + Admin) ────────────────────────────────────
const sendOrderEmails = async (orderData, user) => {
  try {
    const { _id: orderId, amount, items, address, paymentMethod, payment, date } = orderData;

    if (!user?.email || !user?.name) {
      console.error('User data incomplete for order email:', user);
      return false;
    }
    if (!items?.length) {
      console.error('No items in order');
      return false;
    }

    // ── Customer email ──
    const customerHtml = `
${emailHead('Order Confirmed')}
${brandHeader()}

<!-- Heading -->
<tr>
  <td style="padding:56px 56px 48px;background:${B.white};">
    ${eyebrow('Order Status')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${B.black};letter-spacing:1px;">Order Confirmed</h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;max-width:440px;font-weight:400;">
      Thank you, <strong style="color:${B.black};font-weight:500;">${user.name}</strong>. Your order has been received and our artisans are carefully preparing your handcrafted pieces.
    </p>
  </td>
</tr>

${statusBanner('Order Received &amp; Being Prepared', true)}

${sectionDivider}

<!-- Order summary -->
<tr>
  <td style="padding:56px 56px 0;">
    ${eyebrow('Order Summary')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
  </td>
</tr>
<tr>
  <td style="padding:0 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr>
        <td style="padding:18px 22px;background:${B.gray50};border-bottom:1px solid ${B.gray200};">
          <p style="margin:0;font-size:9px;letter-spacing:3px;color:${B.textLight};text-transform:uppercase;font-weight:400;">Reference &nbsp;#${String(orderId).slice(-8).toUpperCase()}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 22px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Order ID', `#${orderId}`)}
            ${infoRow('Date', formatDate(date))}
            ${infoRow('Payment', paymentBadge(paymentMethod, payment))}
            <tr>
              <td style="padding:18px 0 4px;font-size:9px;color:${B.textLight};font-weight:400;letter-spacing:3px;text-transform:uppercase;width:45%;">Order Total</td>
              <td style="padding:18px 0 4px;font-family:Georgia,serif;font-size:28px;color:${B.black};font-weight:400;text-align:right;">${formatINR(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Items -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Your Items')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 20px;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${items.map((item, i) => orderItemRow(item, i === items.length - 1)).join('')}
    </table>
  </td>
</tr>

<!-- Delivery address -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Delivering To')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr><td style="padding:22px 22px;">${addressBlock(address)}</td></tr>
    </table>
  </td>
</tr>

<!-- What's next -->
<tr>
  <td style="padding:48px 56px 0;">
    ${noticeBlock(
      'What Happens Next',
      paymentMethod === 'COD'
        ? 'Your order is being carefully handcrafted. We will notify you when it ships. Please keep the exact cash amount ready upon delivery.'
        : 'Payment confirmed. Our artisans are now preparing your order with care. You will receive tracking details once dispatched.'
    )}
  </td>
</tr>

<!-- Track CTA -->
<tr>
  <td style="padding:56px;text-align:center;">
    ${ctaButton(`${process.env.FRONTEND_URL}/trackorder/${orderId}`, 'Track Your Order')}
    <p style="margin:16px 0 0 0;font-size:10px;color:${B.textFaint};letter-spacing:0.5px;">
      ${process.env.FRONTEND_URL}/trackorder/${orderId}
    </p>
  </td>
</tr>

${brandFooter}
${emailClose}`;

    const customerSent = await sendOrderMail(
      user.email,
      `Order Confirmed #${orderId} – Aharyas`,
      customerHtml,
    );

    // ── Admin emails — notify all unique product owners ──
    const adminIds = new Set();
    for (const item of items) {
      try {
        const product = await productModel.findById(item.productId).populate('adminId');
        if (product?.adminId?.email && !adminIds.has(String(product.adminId._id))) {
          adminIds.add(String(product.adminId._id));
          const owner = product.adminId;

          const adminHtml = `
${emailHead('New Order Alert')}
${brandHeader()}

<!-- Alert banner -->
<tr>
  <td style="padding:0;background:${B.black};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="width:2px;background:${B.gray600};"></td>
        <td style="padding:16px 24px;font-size:9px;font-weight:400;letter-spacing:4px;color:${B.gray300};text-transform:uppercase;">New Order &mdash; Action Required</td>
      </tr>
    </table>
  </td>
</tr>

<!-- Heading -->
<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('Admin Notification')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:${B.black};letter-spacing:1px;">New Order Placed</h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;font-weight:400;">
      Hi <strong style="color:${B.black};font-weight:500;">${owner.name}</strong>, a customer order requires your attention.
    </p>
  </td>
</tr>

${sectionDivider}

<!-- Order info -->
<tr>
  <td style="padding:56px 56px 0;">
    ${eyebrow('Order Information')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
  </td>
</tr>
<tr>
  <td style="padding:0 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr>
        <td style="padding:18px 22px;background:${B.black};border-bottom:1px solid ${B.gray800};">
          <p style="margin:0;font-size:9px;letter-spacing:3px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Order #${String(orderId).slice(-8).toUpperCase()}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 22px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Order ID', `#${orderId}`)}
            ${infoRow('Date', formatDate(date))}
            ${infoRow('Payment', paymentBadge(paymentMethod, payment))}
            <tr>
              <td style="padding:18px 0 4px;font-size:9px;color:${B.textLight};font-weight:400;letter-spacing:3px;text-transform:uppercase;width:45%;">Order Value</td>
              <td style="padding:18px 0 4px;font-family:Georgia,serif;font-size:28px;color:${B.black};font-weight:400;text-align:right;">${formatINR(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Customer details -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Customer Details')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr>
        <td style="padding:4px 22px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Name', user.name)}
            ${infoRow('Email', `<a href="mailto:${user.email}" style="color:${B.textDark};text-decoration:none;">${user.email}</a>`)}
            ${infoRow('Phone', address.phone || 'N/A', true)}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Items to process -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Items to Process')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 20px;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${items.map((item, i) => orderItemRow(
            { ...item, image: item.image || (item.images && item.images[0]) || '' },
            i === items.length - 1
          )).join('')}
    </table>
  </td>
</tr>

<!-- Ship to -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Ship To')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;border-left:2px solid ${B.black};">
      <tr><td style="padding:22px 22px;">${addressBlock(address)}</td></tr>
    </table>
  </td>
</tr>

<!-- Action -->
<tr>
  <td style="padding:48px 56px 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:${B.black};border:1px solid ${B.black};">
      <tr>
        <td style="padding:44px 40px;text-align:center;">
          <p style="margin:0 0 10px 0;font-size:9px;letter-spacing:5px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Action Required</p>
          <p style="margin:0 0 32px 0;font-size:13px;color:${B.gray400};line-height:1.9;max-width:380px;margin-left:auto;margin-right:auto;font-weight:400;">
            ${paymentMethod === 'COD'
              ? 'Cash on Delivery order &mdash; process and ship promptly. Customer pays on arrival.'
              : 'Online payment confirmed &mdash; please process and dispatch this order at the earliest.'
            }
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="background:${B.white};border:1px solid ${B.white};">
                <a href="https://admin.aharyas.com" style="display:block;padding:16px 52px;font-size:10px;font-weight:400;letter-spacing:4px;color:${B.black};text-decoration:none;text-transform:uppercase;">Open Admin Dashboard</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

${brandFooter}
${emailClose}`;

          await sendOrderMail(
            owner.email,
            `New Order #${String(orderId).slice(-6)} – Aharyas Admin`,
            adminHtml,
          );
        }
      } catch (e) {
        console.error('Error finding product owner for admin email:', e.message);
      }
    }

    return customerSent;
  } catch (error) {
    console.error('Error in sendOrderEmails:', error);
    return false;
  }
};

// ─── Shipping Notification ────────────────────────────────────────────────────
const sendShippingEmail = async (orderData, user) => {
  try {
    const { _id: orderId, items, address, amount } = orderData;
    if (!user?.email) { console.error('User data incomplete for shipping email'); return false; }

    const html = `
${emailHead('Order Shipped')}
${brandHeader()}

<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('Shipment Update')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:${B.black};letter-spacing:1px;">Your Order Has Shipped</h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;max-width:440px;font-weight:400;">
      Great news, <strong style="color:${B.black};font-weight:500;">${user.name}</strong>. Your handcrafted pieces have left our warehouse and are heading your way.
    </p>
  </td>
</tr>

${statusBanner('In Transit', true)}

${sectionDivider}

<!-- Shipment details -->
<tr>
  <td style="padding:56px 56px 0;">
    ${eyebrow('Shipment Details')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
  </td>
</tr>
<tr>
  <td style="padding:0 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr>
        <td style="padding:18px 22px;background:${B.gray50};border-bottom:1px solid ${B.gray200};">
          <p style="margin:0;font-size:9px;letter-spacing:3px;color:${B.textLight};text-transform:uppercase;font-weight:400;">Reference &nbsp;#${String(orderId).slice(-8).toUpperCase()}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 22px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Order ID', `#${orderId}`)}
            ${infoRow('Items', `${items.length} item(s)`)}
            <tr>
              <td style="padding:18px 0 4px;font-size:9px;color:${B.textLight};font-weight:400;letter-spacing:3px;text-transform:uppercase;width:45%;">Total</td>
              <td style="padding:18px 0 4px;font-family:Georgia,serif;font-size:26px;color:${B.black};font-weight:400;text-align:right;">${formatINR(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Delivery address -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Delivering To')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr><td style="padding:22px 22px;">${addressBlock(address)}</td></tr>
    </table>
  </td>
</tr>

<!-- What's next -->
<tr>
  <td style="padding:48px 56px 0;">
    ${noticeBlock("What's Next", "Your package is on its way. You will receive another update once it is out for delivery. Please ensure someone is available to receive it.")}
  </td>
</tr>

<tr>
  <td style="padding:56px;text-align:center;">
    ${ctaButton(`${process.env.FRONTEND_URL}/trackorder/${orderId}`, 'Track Your Order')}
  </td>
</tr>

${brandFooter}
${emailClose}`;

    return await sendOrderMail(
      user.email,
      `Your Order #${orderId} Has Shipped – Aharyas`,
      html,
    );
  } catch (error) {
    console.error('Error sending shipping email:', error);
    return false;
  }
};

// ─── Delivery OTP Email ───────────────────────────────────────────────────────
const sendDeliveryOtpEmail = async (orderData, user, deliveryOtp) => {
  try {
    const { _id: orderId, items, amount } = orderData;
    if (!user?.email) { console.error('User data incomplete for delivery OTP email'); return false; }
    if (!deliveryOtp) { console.error('Missing delivery OTP'); return false; }

    const html = `
${emailHead('Delivery Verification Code')}
${brandHeader()}

<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('Delivery Today')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:${B.black};letter-spacing:1px;">Your Order is Arriving Today</h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;max-width:440px;font-weight:400;">
      Hi <strong style="color:${B.black};font-weight:500;">${user.name}</strong>, your order is out for delivery. Share the verification code below with our delivery person to confirm receipt.
    </p>
  </td>
</tr>

${statusBanner(`Out for Delivery &nbsp;&middot;&nbsp; Order #${String(orderId).slice(-8).toUpperCase()} &nbsp;&middot;&nbsp; ${items.length} item(s) &nbsp;&middot;&nbsp; ${formatINR(amount)}`, true)}

${sectionDivider}

${otpBlock(deliveryOtp, 'Share with delivery person only')}

${sectionDivider}

<!-- How it works -->
<tr>
  <td style="padding:48px 56px;">
    ${eyebrow('How Delivery Verification Works')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${stepRow(1, 'Delivery person arrives at your address')}
      ${stepRow(2, 'You share this 6-digit code with them')}
      ${stepRow(3, 'They enter it to confirm delivery in our system')}
      ${stepRow(4, 'You receive a delivery confirmation email', true)}
    </table>
  </td>
</tr>

${sectionDivider}

<!-- Security -->
<tr>
  <td style="padding:48px 56px 56px;">
    ${noticeBlock('Important', `Only share this code with the Aharyas delivery person at your door. Never share it over phone or chat. If you have concerns, call us at <strong>+91 90632 84008</strong>.`)}
  </td>
</tr>

${brandFooter}
${emailClose}`;

    return await sendOrderMail(
      user.email,
      `Delivery Code for Order #${orderId} – Aharyas`,
      html,
    );
  } catch (error) {
    console.error('Error sending delivery OTP email:', error);
    return false;
  }
};

// ─── Delivered Confirmation ───────────────────────────────────────────────────
const sendDeliveredEmail = async (orderData, user) => {
  try {
    const { _id: orderId, items, amount } = orderData;
    if (!user?.email) { console.error('User data incomplete for delivered email'); return false; }

    const html = `
${emailHead('Order Delivered')}
${brandHeader()}

<tr>
  <td style="padding:56px 56px 48px;">
    ${eyebrow('Order Complete')}
    <h2 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:28px;font-weight:400;color:${B.black};letter-spacing:1px;">Order Delivered</h2>
    <div style="height:1px;background:${B.gray200};margin-bottom:22px;"></div>
    <p style="margin:0;font-size:13px;color:${B.textLight};line-height:1.9;max-width:440px;font-weight:400;">
      Congratulations, <strong style="color:${B.black};font-weight:500;">${user.name}</strong>. Your handcrafted Aharyas pieces have been delivered. We hope you love them.
    </p>
  </td>
</tr>

${statusBanner('Delivered Successfully', true)}

${sectionDivider}

<!-- Delivery summary -->
<tr>
  <td style="padding:56px 56px 0;">
    ${eyebrow('Delivery Confirmed')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 0;"></div>
  </td>
</tr>
<tr>
  <td style="padding:0 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-top:none;">
      <tr>
        <td style="padding:18px 22px;background:${B.black};border-bottom:1px solid ${B.gray800};">
          <p style="margin:0;font-size:9px;letter-spacing:3px;color:${B.gray400};text-transform:uppercase;font-weight:400;">Order #${String(orderId).slice(-8).toUpperCase()}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 22px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${infoRow('Order ID', `#${orderId}`)}
            ${infoRow('Items Delivered', `${items.length} item(s)`)}
            ${infoRow('Delivered On', formatDate(Date.now()))}
            <tr>
              <td style="padding:18px 0 4px;font-size:9px;color:${B.textLight};font-weight:400;letter-spacing:3px;text-transform:uppercase;width:45%;">Total</td>
              <td style="padding:18px 0 4px;font-family:Georgia,serif;font-size:28px;color:${B.black};font-weight:400;text-align:right;">${formatINR(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Items -->
<tr>
  <td style="padding:48px 56px 0;">
    ${eyebrow('Items Delivered')}
    <div style="height:1px;background:${B.gray200};margin:16px 0 20px;"></div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${items.map((item, i) => orderItemRow(
      { ...item, image: item.image || (item.images && item.images[0]) || '' },
      i === items.length - 1
    )).join('')}
    </table>
  </td>
</tr>

<!-- Feedback -->
<tr>
  <td style="padding:48px 56px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};border-left:2px solid ${B.black};">
      <tr>
        <td style="padding:28px 24px;">
          <p style="margin:0 0 8px 0;font-size:9px;font-weight:400;color:${B.textLight};letter-spacing:4px;text-transform:uppercase;">Share Your Experience</p>
          <p style="margin:0 0 24px 0;font-family:Georgia,serif;font-size:15px;color:${B.textMid};line-height:1.9;font-weight:400;font-style:italic;">Your feedback helps our artisans reach more people who value handcrafted heritage.</p>
          ${outlineCtaButton(`${process.env.FRONTEND_URL}/trackorder/${orderId}`, 'View Order &amp; Leave a Review')}
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Returns note -->
<tr>
  <td style="padding:48px 56px 56px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid ${B.gray200};">
      <tr>
        <td style="padding:18px 22px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${B.textLight};line-height:1.8;font-weight:400;">
            Any issues? Contact us within <strong style="color:${B.black};font-weight:500;">7 days</strong> of delivery at
            <a href="mailto:support@aharyas.com" style="color:${B.black};text-decoration:none;font-weight:500;">support@aharyas.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

${brandFooter}
${emailClose}`;

    return await sendOrderMail(
      user.email,
      `Order #${orderId} Delivered – Thank You | Aharyas`,
      html,
    );
  } catch (error) {
    console.error('Error sending delivered email:', error);
    return false;
  }
};

export {
  sendOrderMail, sendOrderEmails, sendShippingEmail, sendDeliveryOtpEmail, sendDeliveredEmail,
};
export default sendOrderEmails;