import { supabase } from '../src/integrations/supabase/client';

export const authService = {
  init: async () => { },

  verify: async (password: string): Promise<{ success: boolean; resetRequired: boolean }> => {
    try {
      const { data: edgeData, error } = await supabase.functions.invoke('auth', {
        body: { action: 'auth_verify', password }
      });
      if (error) return { success: false, resetRequired: false };
      return edgeData;
    } catch (e) {
      console.error("Auth Exception:", e);
      return { success: false, resetRequired: false };
    }
  },

  changePassword: async (newPassword: string, currentPassword?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'auth_change_password', newPassword, currentPassword }
      });
      if (error) return false;
      return data.success;
    } catch (e) {
      console.error("Change Password Error:", e);
      return false;
    }
  }
};
