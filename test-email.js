#!/usr/bin/env node

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD,
  EMAIL_FROM,
} = process.env;

console.log('🧪 Testing Email Configuration...\n');

console.log('📋 Configuration:');
console.log(`  Host: ${EMAIL_SERVER_HOST}`);
console.log(`  Port: ${EMAIL_SERVER_PORT}`);
console.log(`  User: ${EMAIL_SERVER_USER}`);
console.log(`  Password: ${'*'.repeat(EMAIL_SERVER_PASSWORD?.length || 0)}`);
console.log(`  From: ${EMAIL_FROM}\n`);

if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_PORT || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
  console.error('❌ Missing email configuration in .env file');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: EMAIL_SERVER_HOST,
  port: parseInt(EMAIL_SERVER_PORT),
  secure: EMAIL_SERVER_PORT === '465',
  auth: {
    user: EMAIL_SERVER_USER,
    pass: EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

console.log('🔌 Testing SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
    process.exit(1);
  }

  console.log('✓ SMTP connection successful!\n');

  console.log('📧 Sending test email...');

  const testEmail = EMAIL_SERVER_USER.includes('@') 
    ? EMAIL_SERVER_USER 
    : 'test@example.com';

  transporter.sendMail(
    {
      from: EMAIL_FROM,
      to: testEmail,
      subject: 'Test Email from Spinofy',
      text: 'This is a test email to verify your SMTP configuration is working correctly.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p>If you received this, your email setup is working! ✓</p>
      `,
    },
    (error, info) => {
      if (error) {
        console.error('❌ Email send failed:', error.message);
        process.exit(1);
      }

      console.log('✓ Email sent successfully!');
      console.log(`  Message ID: ${info.messageId}\n`);
      console.log('📮 Check your Mailtrap inbox or email to verify!\n');
      process.exit(0);
    }
  );
});
