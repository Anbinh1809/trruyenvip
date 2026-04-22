import { withTitan } from '@/core/api/handler';
import { query } from '@/core/database/connection';

/**
 * GET: Standardized User Identity Retrieval
 * Uses the unified getSession() from auth.js to ensure consistency.
 */
export const GET = withTitan({
  allowOptional: true,
  handler: async (req, session) => {
    try {
      if (!session) {
        return { authenticated: false };
      }

      // FETCH FULL RECORD to ensure the freshest stats and mission data
        SELECT uuid, username, email, role, avatar, xp, [vipCoins], mission_data 
        FROM users 
        WHERE uuid = @uuid
      `, { uuid: session.uuid });
      
      const user = res.recordset?.[0];

      if (!user) {
        return { authenticated: false, error: 'User not found' };
      }

      return {
        auth: true,
        authenticated: true,
        user: {
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          xp: user.xp,
          vipCoins: user.vipCoins, // Fixed: Use exact DB case
          missionData: user.mission_data
        }
      };
    } catch (e) {
      console.error('Me error:', e);
      throw { status: 500, message: 'Internal Server Error' };
    }
  }
});

