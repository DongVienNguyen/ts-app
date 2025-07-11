import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

const CreateTestAdminButton: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTestAdmin = async () => {
    setIsCreating(true);
    try {
      // Create test admin user
      const { data, error } = await supabase
        .from('staff')
        .insert([
          {
            username: 'testadmin',
            password: 'admin123', // This will be hashed by the trigger
            staff_name: 'Test Admin',
            role: 'admin',
            department: 'IT',
            email: 'testadmin@example.com'
          }
        ])
        .select();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.info('Test admin user already exists');
        } else {
          throw error;
        }
      } else {
        toast.success('Test admin user created successfully!\nUsername: testadmin\nPassword: admin123');
      }
    } catch (error) {
      console.error('Error creating test admin:', error);
      toast.error('Failed to create test admin: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={createTestAdmin}
      disabled={isCreating}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {isCreating ? 'Creating...' : 'Create Test Admin'}
    </Button>
  );
};

export default CreateTestAdminButton;