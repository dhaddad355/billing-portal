-- Seed Data for Letter Templates Feature
-- This file populates sample letter templates for testing

-- Sample letter templates
INSERT INTO letter_templates (id, name, body, is_active) VALUES
('11111111-aaaa-1111-aaaa-111111111111', 'Referral Acknowledgment', 
'<p>Dear {{Provider_Full_Name}},</p>

<p>Thank you for referring <strong>{{Patient_Full_Name}}</strong> to our practice. We have received your referral and are pleased to assist with their care.</p>

<p><strong>Patient Information:</strong></p>
<ul>
  <li>Name: {{Patient_Full_Name}}</li>
  <li>Date of Birth: {{Patient_DOB}}</li>
  <li>Reason for Referral: {{Referral_Reason}}</li>
</ul>

<p>We will contact the patient at {{Patient_Phone}} to schedule an appointment at their earliest convenience.</p>

<p>If you have any questions or need additional information, please do not hesitate to contact our office.</p>

<p>Sincerely,<br/>
MyLEI Eye Institute</p>', true),

('22222222-bbbb-2222-bbbb-222222222222', 'Post-Procedure Report',
'<p>Dear {{Provider_Full_Name}},</p>

<p>This letter is to inform you that your patient, <strong>{{Patient_Full_Name}}</strong>, successfully completed their procedure on {{Current_Date}}.</p>

<p><strong>Procedure Details:</strong></p>
<ul>
  <li>Procedure Type: {{Procedure_Type}}</li>
  <li>Visual Acuity (Pre-Op): {{Pre_Op_Visual_Acuity}}</li>
  <li>Visual Acuity (Post-Op): {{Post_Op_Visual_Acuity}}</li>
</ul>

<p><strong>Post-Operative Instructions:</strong></p>
<p>The patient has been provided with detailed post-operative care instructions. A follow-up appointment has been scheduled.</p>

<p><strong>Medications Prescribed:</strong></p>
<p>{{Prescribed_Medications}}</p>

<p>We will continue to monitor the patient''s progress and provide you with updates as needed.</p>

<p>Thank you for your continued partnership in patient care.</p>

<p>Sincerely,<br/>
MyLEI Eye Institute</p>', true),

('33333333-cccc-3333-cccc-333333333333', 'Consultation Summary',
'<p><strong>CONSULTATION SUMMARY</strong></p>

<p><strong>Patient:</strong> {{Patient_Full_Name}}<br/>
<strong>DOB:</strong> {{Patient_DOB}}<br/>
<strong>Date of Consultation:</strong> {{Current_Date}}<br/>
<strong>Referring Provider:</strong> {{Provider_Full_Name}}, {{Provider_Degree}}</p>

<hr/>

<p><strong>Reason for Consultation:</strong><br/>
{{Referral_Reason}}</p>

<p><strong>Clinical Findings:</strong><br/>
{{Clinical_Findings}}</p>

<p><strong>Diagnostic Tests Performed:</strong></p>
<ul>
  <li>{{Diagnostic_Tests}}</li>
</ul>

<p><strong>Assessment:</strong><br/>
{{Assessment}}</p>

<p><strong>Recommendations:</strong><br/>
{{Recommendations}}</p>

<p><strong>Plan:</strong><br/>
{{Treatment_Plan}}</p>

<hr/>

<p>Thank you for referring this patient. Please contact us if you have any questions regarding our findings or recommendations.</p>

<p>Sincerely,<br/>
<br/>
<br/>
_____________________________<br/>
Physician Signature</p>', true),

('44444444-dddd-4444-dddd-444444444444', 'Quote Letter',
'<p>Dear {{Patient_Full_Name}},</p>

<p>Thank you for your interest in {{Procedure_Type}} at MyLEI Eye Institute. Following your consultation on {{Consultation_Date}}, we are pleased to provide you with the following pricing information.</p>

<p><strong>Procedure Quote:</strong></p>
<table style="border-collapse: collapse; width: 100%;">
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="padding: 8px;"><strong>Procedure</strong></td>
    <td style="padding: 8px; text-align: right;"><strong>Cost</strong></td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="padding: 8px;">{{Procedure_Type}}</td>
    <td style="padding: 8px; text-align: right;">{{Procedure_Cost}}</td>
  </tr>
  <tr>
    <td style="padding: 8px;"><strong>Total</strong></td>
    <td style="padding: 8px; text-align: right;"><strong>{{Total_Cost}}</strong></td>
  </tr>
</table>

<p><strong>Payment Options:</strong></p>
<p>We offer several payment options including financing through CareCredit. Please contact our office to discuss the best option for you.</p>

<p>This quote is valid for 30 days from the date of this letter. If you have any questions or would like to schedule your procedure, please call us at (313) 555-0100.</p>

<p>We look forward to helping you achieve better vision.</p>

<p>Sincerely,<br/>
MyLEI Eye Institute</p>', true),

('55555555-eeee-5555-eeee-555555555555', 'Appointment Reminder',
'<p>Dear {{Patient_Full_Name}},</p>

<p>This is a reminder of your upcoming appointment at MyLEI Eye Institute.</p>

<p><strong>Appointment Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{Appointment_Date}}</li>
  <li><strong>Time:</strong> {{Appointment_Time}}</li>
  <li><strong>Location:</strong> 123 Medical Center Drive, Suite 100, Detroit, MI 48226</li>
  <li><strong>Purpose:</strong> {{Appointment_Purpose}}</li>
</ul>

<p><strong>Please Remember:</strong></p>
<ul>
  <li>Arrive 15 minutes early to complete any necessary paperwork</li>
  <li>Bring your insurance card and a valid photo ID</li>
  <li>Bring a list of current medications</li>
  <li>Arrange for transportation if your eyes will be dilated</li>
</ul>

<p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance at (313) 555-0100.</p>

<p>We look forward to seeing you!</p>

<p>Sincerely,<br/>
MyLEI Eye Institute</p>', true);
