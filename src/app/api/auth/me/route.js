import { withTitan } from '@/core/api/handler';
import { query } from '@/core/database/connection';

/**
 * GET: Standardized User Identity Retrieval
 * Uses the unified getSession() from auth.js to ensure consistency.
 */
export const GET = withTitan({
  allowOptional: true,
  handler: async (req, session) => {
    if (!session) {
      return { authenticated: false };
    }

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
        vipCoins: user.vipcoins, // Mapping DB naming to camelCase
        missionData: user.mission_data
      }
    };
  }
});

