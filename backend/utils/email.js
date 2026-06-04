const nodemailer = require('nodemailer');

/**
 * Reusable email sending helper.
 * If SMTP server configuration is present in .env, sends a real email.
 * Otherwise, logs the email details to the console as a mock.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.text - Plain text email content
 * @param {string} params.html - HTML email content
 */
async function sendEmail({ to, subject, text, html }) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.log('\n=================== MOCK EMAIL SENT ===================');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${text}`);
        console.log('=======================================================\n');
        return { sent: true, mock: true };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port, 10) || 587,
            secure: port === '465',
            auth: {
                user,
                pass
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"GS Corporate Support Desk" <${user}>`,
            to,
            subject,
            text,
            html
        });

        console.log(`[Email Service] Email notification successfully sent to: ${to}`);
        return { sent: true, mock: false };
    } catch (err) {
        console.error('[Email Service] Failed to send email:', err);
        return { sent: false, error: err.message };
    }
}

module.exports = {
    sendEmail
};
