import { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { supabase } from '@/integrations/supabase/client';
import { Staff, StaffMember } from '@/types/staff';

export const useStaffData = () => {
  const [staff, setStaff] = useState<Staff>({
    cbqln: [],
    cbkh: [],
    ldpcrc: [],
    cbcrc: [],
    quycrc: [],
  });

  const staffList = useMemo(() => {
    const allStaff = [
      ...staff.cbqln,
      ...staff.cbkh,
      ...staff.ldpcrc,
      ...staff.cbcrc,
      ...staff.quycrc,
    ];
    return _.uniqBy(allStaff, 'ten_nv');
  }, [staff]);

  const loadStaffData = async () => {
    try {
      const { data: cbqlnData, error: cbqlnError } = await supabase
        .from('cbqln')
        .select('id, ten_nv, email');
      if (cbqlnError) throw cbqlnError;

      const { data: cbkhData, error: cbkhError } = await supabase
        .from('cbkh')
        .select('id, ten_nv, email');
      if (cbkhError) throw cbkhError;

      const { data: ldpcrcData, error: ldpcrcError } = await supabase
        .from('ldpcrc')
        .select('id, ten_nv, email');
      if (ldpcrcError) throw ldpcrcError;

      const { data: cbcrcData, error: cbcrcError } = await supabase
        .from('cbcrc')
        .select('id, ten_nv, email');
      if (cbcrcError) throw cbcrcError;

      const { data: quycrcData, error: quycrcError } = await supabase
        .from('quycrc')
        .select('id, ten_nv, email');
      if (quycrcError) throw quycrcError;

      setStaff({
        cbqln: (cbqlnData as StaffMember[]) || [],
        cbkh: (cbkhData as StaffMember[]) || [],
        ldpcrc: (ldpcrcData as StaffMember[]) || [],
        cbcrc: (cbcrcData as StaffMember[]) || [],
        quycrc: (quycrcData as StaffMember[]) || [],
      });
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  return { staff, staffList, loadStaffData };
};