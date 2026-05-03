const otpCodeEmailHTML = ({ otpCode }) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Troski Verification</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
    <style type="text/css">
      body, table, td, p, a { font-family: 'Poppins', Arial, sans-serif !important; }
    </style>
  <![endif]-->
  <style type="text/css">
    body {
      font-family: 'Poppins', sans-serif !important;
    }
    /* Specific fix for Mobile Gmail to ensure OTP stays large */
    @media only screen and (max-width:600px) {
      .es-content-body { width:100% !important; }
      .es-header-body { width:100% !important; }
      h1 { font-size:24px !important; text-align:center !important; }
      .mobile-otp { 
        font-size: 32px !important; 
        line-height: 50px !important; 
        letter-spacing: 6px !important; 
      }
        .mobile-troski{
        color: #000000 !important;  
      }
      .otp-container {
        padding: 15px 10px !important;
        width: 80% !important;
      }
    }
  </style>
 </head>
 <body class="body" style="width:100%; height:100%; font-family:'Poppins', sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; padding:0; margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA">
    <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px; padding:0; margin:0; width:100%; height:100%">
      <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0; margin:0">
          <!-- HEADER START -->
          <table cellpadding="0" cellspacing="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px; width:100%; background-color:transparent">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0; margin:0">
                <table cellspacing="0" cellpadding="0" bgcolor="#ffcc00" align="center" class="es-header-body" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px; background-color:#ffcc00; width:600px" role="none">
                  <tr style="border-collapse:collapse">
                    <td align="center" style="margin:0; padding:25px 20px; background-color:#ffcc00">
                      <!-- FIXED: Color set to #000000 -->
                      <h1 class="mobile-troski" style="margin:0; font-family:'Poppins', sans-serif; mso-line-height-rule:exactly; letter-spacing:2px; font-size:26px; font-weight:700; line-height:30px; color:#000000; text-transform:uppercase; text-align:center;">
                        TROSKI SYSTEM
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!-- CONTENT START -->
          <table cellspacing="0" cellpadding="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px; width:100%">
            <tr style="border-collapse:collapse">
              <td bgcolor="#fafafa" align="center" style="padding:0; margin:0; background-color:#FAFAFA">
                <table cellspacing="0" cellpadding="0" bgcolor="#333333" align="center" class="es-content-body" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px; background-color:#333333; width:600px" role="none">
                  <tr style="border-collapse:collapse">
                    <td align="center" style="padding:50px 40px; margin:0; background-color:#333333">
                      <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" style="padding:0 0 20px 0; margin:0">
                            <p style="margin:0; font-family:'Poppins', sans-serif; line-height:24px; color:#ffebbb; font-size:16px; font-weight:300;">
                              Your one-time verification code:
                            </p>
                          </td>
                        </tr>
                        <tr style="border-collapse:collapse">
                          <td align="center" style="padding:10px 0 30px 0; margin:0">
                            <!-- ADDED CLASSES FOR MOBILE OVERRIDE -->
                            <div class="otp-container" style="display:inline-block; padding:10px 20px; border:2px dashed #ffcc00; border-radius:12px;">
                                <p class="mobile-otp" style="margin:0; font-family:'Poppins', sans-serif; line-height:50px; letter-spacing:6px; color:#ffcc00; font-size:32px; font-weight:700;">
                                  ${otpCode}
                                </p>
                            </div>
                          </td>
                        </tr>
                        <tr style="border-collapse:collapse">
                          <td align="center" style="padding:20px 0 0 0; margin:0">
                            <p style="margin:0; font-family:'Poppins', sans-serif; line-height:24px; color:#ffebbb; font-size:14px; text-align:center; font-weight:300;">
                              This code expires after <strong>5 minutes</strong>. If you did not request this, please change your pin code or contact Troski Support.
                            </p>
                          </td>
                        </tr>
                        <tr style="border-collapse:collapse">
                          <td align="center" style="padding:60px 0 0 0; margin:0">
                            <p style="margin:0; font-family:'Poppins', sans-serif; line-height:18px; color:#999999; font-size:11px; letter-spacing:1px; text-transform:uppercase;">
                              Sent by <span style="color:#ffcc00; font-weight:600;">Troski, Inc.</span>
                            </p>
                            <p style="margin:5px 0 0 0; font-family:'Poppins', sans-serif; line-height:18px; color:#777777; font-size:11px;">
                              Ayeduase Street, Kumasi
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
 </body>
</html>`;
};

module.exports = { otpCodeEmailHTML };
