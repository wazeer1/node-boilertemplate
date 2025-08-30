import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Create email transporter
 */
const createTransporter = () => {
  // For development, use ethereal email or log emails
  if (config.nodeEnv === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  // For production, use real SMTP
  return nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
};

/**
 * Send email
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent successfully to ${to}`, {
      messageId: info.messageId,
      subject
    });

    return info;
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message
    });
    throw new Error('Failed to send email');
  }
};

/**
 * Send email verification email
 */
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${config.cors.origin}/verify-email?token=${token}`;

  const subject = 'Verify Your Email Address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Our Platform!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you didn't create an account, please ignore this email.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${config.cors.origin}/reset-password?token=${token}`;

  const subject = 'Reset Your Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      
      <p>This link will expire in 1 hour.</p>
      
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, firstName) => {
  const subject = 'Welcome to Our Platform!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${firstName}!</h2>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      
      <p>Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with other users</li>
        <li>Check out our documentation</li>
      </ul>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br>The Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send account deletion confirmation email
 */
const sendAccountDeletionEmail = async (email, firstName) => {
  const subject = 'Account Deletion Confirmation';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Account Deleted</h2>
      <p>Dear ${firstName},</p>
      
      <p>Your account has been successfully deleted as requested.</p>
      
      <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
      
      <p>Thank you for being part of our community.</p>
      
      <p>Best regards,<br>The Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Send security alert email
 */
const sendSecurityAlertEmail = async (email, firstName, action, location = 'Unknown') => {
  const subject = 'Security Alert - Account Activity';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">Security Alert</h2>
      <p>Dear ${firstName},</p>
      
      <p>We detected the following activity on your account:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>If this was you, no action is needed. If you didn't perform this action, please:</p>
      <ol>
        <li>Change your password immediately</li>
        <li>Enable two-factor authentication</li>
        <li>Contact our support team</li>
      </ol>
      
      <p>Best regards,<br>The Security Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    logger.info('Email configuration is valid');
    return true;
  } catch (error) {
    logger.error('Email configuration is invalid', { error: error.message });
    return false;
  }
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountDeletionEmail,
  sendSecurityAlertEmail,
  testEmailConfig
};
