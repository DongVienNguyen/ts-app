import { formatEmail } from '@/utils/emailUtils';

// Staff Member interface
interface StaffMember {
  id: string;
  ten_nv: string;
  email: string;
}

interface Staff {
  cbkh: StaffMember[];
  cbqln: StaffMember[];
}

export const getRecipients = (
  staff: Staff,
  cbkh: string | null,
  cbqln: string | null
): string[] => {
  const recipients: string[] = [];
  
  // Get CBKH email if exists and not "Chưa chọn"
  if (cbkh && cbkh !== 'Chưa chọn') {
    const cbkhMember = staff.cbkh.find(member => member.ten_nv === cbkh);
    if (cbkhMember && cbkhMember.email) {
      const formattedEmail = formatEmail(cbkhMember.email);
      if (formattedEmail) {
        recipients.push(formattedEmail);
      }
    }
  }
  
  // Get CBQLN email if exists and not "Chưa chọn"
  if (cbqln && cbqln !== 'Chưa chọn') {
    const cbqlnMember = staff.cbqln.find(member => member.ten_nv === cbqln);
    if (cbqlnMember && cbqlnMember.email) {
      const formattedEmail = formatEmail(cbqlnMember.email);
      if (formattedEmail) {
        recipients.push(formattedEmail);
      }
    }
  }

  return recipients;
};