const catchAsyncError = require("../utils/catchAsyncError");

exports.termsandcondition = catchAsyncError(async (req, res, next) => {
  const termsBody = ` 
  <h1>Terms and Conditions</h1>
  <p>Welcome to our website. These terms and conditions outline the rules and regulations for the use of our website.</p>
  
  <h2>1. Terms</h2>
  <p>By accessing this website, you agree to be bound by these terms and conditions, all applicable laws, and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p>
  
  <h2>2. Use License</h2>
  <p>Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license, you may not:</p>
  <ul>
    <li>modify or copy the materials;</li>
    <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
    <li>attempt to decompile or reverse engineer any software contained on our website;</li>
    <li>remove any copyright or other proprietary notations from the materials; or</li>
    <li>transfer the materials to another person or 'mirror' the materials on any other server.</li>
  </ul>
  
  <h2>3. Disclaimer</h2>
  <p>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
  
  <h2>4. Limitations</h2>
  <p>In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or our authorized representative have been notified orally or in writing of the possibility of such damage.</p>
  
  <h2>5. Revisions and Errata</h2>
  <p>The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our website are accurate, complete, or current. We may make changes to the materials contained on our website at any time without notice.</p>
  
  <h2>6. Governing Law</h2>
  <p>Any claim relating to our website shall be governed by the laws of [Your Country], without regard to its conflict of law provisions.</p>

  <p>This is just a sample of terms and conditions. Please replace this content with your own terms and conditions.</p>
`;
  res.set("Content-Type", "text/html");
  res.status(200).send(termsBody);
});

exports.privacypolicy = catchAsyncError(async (req, res, next) => {
    const termsBody = `<h1>Privacy Policy</h1>
    <p>At our website, we respect and protect the privacy of our users. This Privacy Policy outlines the types of personal information that is received and collected and how it is used.</p>
    
    <h2>1. Information Collection</h2>
    <p>We collect several different types of information for various purposes to provide and improve our service to you.</p>
    <ul>
      <li>Personal Data: While using our service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you.</li>
      <li>Usage Data: We may also collect information on how the service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address, browser type, browser version, the pages of our service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.</li>
    </ul>
    
    <h2>2. Use of Data</h2>
    <p>We use the collected data for various purposes:</p>
    <ul>
      <li>To provide and maintain the service</li>
      <li>To notify you about changes to our service</li>
      <li>To provide customer care and support</li>
      <li>To monitor the usage of the service</li>
      <li>To detect, prevent and address technical issues</li>
    </ul>
    
    <h2>3. Security</h2>
    <p>The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.</p>
    
    <h2>4. Changes to This Privacy Policy</h2>
    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
    
    <h2>5. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us.</p>

    <p>This is just a sample of a privacy policy. Please replace this content with your own privacy policy.</p>
  `;
    res.set("Content-Type", "text/html");
    res.status(200).send(termsBody);
  });