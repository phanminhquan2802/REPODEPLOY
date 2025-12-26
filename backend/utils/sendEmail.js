import nodemailer from 'nodemailer';

// Tạo transporter để gửi email
// Sử dụng Gmail SMTP (có thể thay đổi cho email khác)
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || process.env.EMAIL_USERNAME;
  const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass, // Sử dụng App Password cho Gmail
    },
  });
};

/**
 * Gửi email với mã xác nhận
 * @param {string} to - Email người nhận
 * @param {string} resetCode - Mã xác nhận 6 chữ số
 * @returns {Promise} - Promise của việc gửi email
 */
export const sendResetPasswordEmail = async (to, resetCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SMART Store" <${process.env.EMAIL_USER || process.env.EMAIL_USERNAME || 'noreply@smartstore.com'}>`,
      to: to,
      subject: '🔐 Mã xác nhận đặt lại mật khẩu - SMART Store',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .code-box {
              background: #f0f0f0;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>SMART Store</strong>.</p>
              
              <p>Vui lòng sử dụng mã xác nhận sau để đặt lại mật khẩu:</p>
              
              <div class="code-box">
                <div class="code">${resetCode}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Mã xác nhận có hiệu lực trong <strong>10 phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                </ul>
              </div>
              
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này một cách an toàn.</p>
              
              <p>Trân trọng,<br><strong>Đội ngũ SMART Store</strong></p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              <p>&copy; ${new Date().getFullYear()} SMART Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Đặt lại mật khẩu - SMART Store
        
        Xin chào,
        
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        
        Mã xác nhận của bạn là: ${resetCode}
        
        Mã này có hiệu lực trong 10 phút.
        
        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        
        Trân trọng,
        Đội ngũ SMART Store
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email đã được gửi:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
    
    // Cung cấp thông báo lỗi chi tiết hơn
    if (error.code === 'EAUTH') {
      throw new Error('Xác thực email thất bại. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASSWORD trong file .env');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Không thể kết nối đến máy chủ email. Vui lòng kiểm tra kết nối internet.');
    } else {
      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }
};

export default sendResetPasswordEmail;

