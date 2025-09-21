import { supabase } from './supabase'
import type { User, QuizSession } from './supabase'

export class UserService {
  /**
   * Create or update a user in the database
   */
  static async createOrUpdateUser(firstName: string, lastName: string): Promise<User | null> {
    try {
      // Check if user already exists
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim())
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error searching for user:', searchError)
        throw new Error('Failed to search for existing user')
      }

      if (existingUser) {
        // User exists, update the updated_at timestamp
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating user:', updateError)
          throw new Error('Failed to update user')
        }

        return updatedUser
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          throw new Error('Failed to create user')
        }

        return newUser
      }
    } catch (error) {
      console.error('UserService.createOrUpdateUser error:', error)
      return null
    }
  }

  /**
   * Create a new quiz session for a user
   */
  static async createQuizSession(userId: string, roundNumber: number): Promise<QuizSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .insert([
          {
            user_id: userId,
            round_number: roundNumber,
            status: 'pending',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating quiz session:', error)
        throw new Error('Failed to create quiz session')
      }

      return session
    } catch (error) {
      console.error('UserService.createQuizSession error:', error)
      return null
    }
  }

  /**
   * Get leaderboard data for a specific round or overall
   */
  static async getLeaderboard(roundNumber?: number, limit: number = 10): Promise<any[]> {
    try {
      let query;
      
      if (roundNumber) {
        // Get round-specific leaderboard
        query = supabase
          .from('round_leaderboard_view')
          .select('*')
          .eq('round_number', roundNumber)
          .limit(limit)
      } else {
        // Get overall leaderboard
        query = supabase
          .from('overall_leaderboard_view')
          .select('*')
          .limit(limit)
      }
      
      const { data: leaderboard, error } = await query
      
      if (error) {
        console.error('Error fetching leaderboard:', error)
        return []
      }
      
      return leaderboard || []
    } catch (error) {
      console.error('UserService.getLeaderboard error:', error)
      return []
    }
  }

  /**
   * Get user progress across all rounds
   */
  static async getUserProgress(userId: string): Promise<any> {
    try {
      const { data: sessions, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('round_number', { ascending: true })

      if (error) {
        console.error('Error fetching user progress:', error)
        return { completedRounds: [], totalScore: 0, averageScore: 0 }
      }

      const completedRounds = sessions?.map(s => s.round_number) || []
      const totalScore = sessions?.reduce((sum, session) => sum + (session.score || 0), 0) || 0
      const averageScore = sessions?.length ? totalScore / sessions.length : 0

      return {
        completedRounds,
        totalScore,
        averageScore: Math.round(averageScore * 100) / 100,
        sessions: sessions || []
      }
    } catch (error) {
      console.error('UserService.getUserProgress error:', error)
      return { completedRounds: [], totalScore: 0, averageScore: 0 }
    }
  }

  /**
   * Check if user can access a specific round
   */
  static async canAccessRound(userId: string, roundNumber: number): Promise<boolean> {
    try {
      if (roundNumber === 1) {
        return true; // Everyone can access Round 1
      }

      // Get user approval status
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('round2_approved, round3_approved')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user approval status:', userError)
        return false
      }

      // For Round 2 and 3, only check admin approval
      if (roundNumber === 2) {
        return user.round2_approved === true
      }
      if (roundNumber === 3) {
        return user.round3_approved === true
      }

      return false
    } catch (error) {
      console.error('UserService.canAccessRound error:', error)
      return false
    }
  }

  /**
   * Update quiz session status and score
   */
  static async updateQuizSession(
    sessionId: string, 
    updates: Partial<QuizSession>
  ): Promise<QuizSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating quiz session:', error)
        throw new Error('Failed to update quiz session')
      }

      return session
    } catch (error) {
      console.error('UserService.updateQuizSession error:', error)
      return null
    }
  }
}

export default UserService