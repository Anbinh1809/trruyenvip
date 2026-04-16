import { withTitan } from '@/lib/api-handler';
import { query } from '@/lib/db';

/**
 * GET: Standardized User Identity Retrieval
 * Uses the unified getSession() from auth.js to ensure consistency.
 */
export const GET = withTitan({
  handler: async (req, session) => {
    if (!session) {
      return { authenticated: false };
    }

    try {
      // FETCH FULL RECORD to ensure the freshest stats and mission data
      const res = await query(`
        SELECT uuid, username, email, role, avatar, xp, vipcoins, mission_data 
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
          vipCoins: user.vipcoins, // FIXED: Corrected property access key to match DB naming
          missionData: user.mission_data
        }
      };
    } catch (err) {
      console.error('[TITAN] Identity Verification Error:', err.message);
      return { authenticated: false, error: 'Internal system error' };
    }
  }
});
