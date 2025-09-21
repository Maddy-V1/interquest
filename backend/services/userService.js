const { supabase } = require('../config/supabase')

class UserService {
  /**
   * Create or update a user in the database
   */
  static async createOrUpdateUser(firstName, lastName) {
    try {
      // Check if user already exists
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim())
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
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
      throw error
    }
  }

  /**
   * Create a new quiz session for a user
   */
  static async createQuizSession(userId, roundNumber) {
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
      throw error
    }
  }

  /**
   * Get leaderboard data for specific round or overall
   */
  static async getLeaderboard(roundNumber = null, limit = 10) {
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
        throw new Error('Failed to fetch leaderboard')
      }
      
      return leaderboard || []
    } catch (error) {
      console.error('UserService.getLeaderboard error:', error)
      throw error
    }
  }

  /**
   * Get user progress across all rounds
   */
  static async getUserProgress(userId) {
    try {
      const { data: sessions, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('round_number', { ascending: true })

      if (error) {
        console.error('Error fetching user progress:', error)
        throw new Error('Failed to fetch user progress')
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
      throw error
    }
  }

  /**
   * Check if user can access a specific round
   */
  static async canAccessRound(userId, roundNumber) {
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
        throw new Error('Failed to check user approval status')
      }

      // For Round 2 and 3, only check admin approval (not previous round completion)
      if (roundNumber === 2) {
        return user.round2_approved === true
      }
      if (roundNumber === 3) {
        return user.round3_approved === true
      }

      return false
    } catch (error) {
      console.error('UserService.canAccessRound error:', error)
      throw error
    }
  }

  /**
   * Get questions for a specific round
   */
  static async getRoundQuestions(roundNumber) {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('round_number', roundNumber)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching round questions:', error)
        throw new Error('Failed to fetch round questions')
      }

      return questions || []
    } catch (error) {
      console.error('UserService.getRoundQuestions error:', error)
      throw error
    }
  }

  /**
   * Update quiz session
   */
  static async updateQuizSession(sessionId, updates) {
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
      throw error
    }
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId) {
    try {
      const { data: stats, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (error) {
        console.error('Error fetching user stats:', error)
        throw new Error('Failed to fetch user stats')
      }

      const totalQuizzes = stats.length
      const totalScore = stats.reduce((sum, session) => sum + (session.score || 0), 0)
      const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0
      const bestScore = Math.max(...stats.map(s => s.score || 0), 0)

      return {
        totalQuizzes,
        totalScore,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore
      }
    } catch (error) {
      console.error('UserService.getUserStats error:', error)
      throw error
    }
  }
}

module.exports = UserService