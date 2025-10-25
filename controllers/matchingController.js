const pool = require('../config/db');

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get matched jobs for the current user
exports.getMatchedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user details and role-specific info
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];
    let roleDetails = null;

    // Fetch role-specific details
    if (userRole === 'haulier') {
      const haulierQuery = await pool.query(
        'SELECT * FROM hauliers WHERE user_id = $1',
        [userId]
      );
      roleDetails = haulierQuery.rows[0];
    } else if (userRole === 'logistics_company') {
      const logisticsQuery = await pool.query(
        'SELECT * FROM logistics_companies WHERE user_id = $1',
        [userId]
      );
      roleDetails = logisticsQuery.rows[0];
    }

    // Get all available jobs (not booked, not created by user)
    const jobsQuery = await pool.query(`
      SELECT 
        j.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        u.email as creator_email
      FROM jobs j
      JOIN users u ON j.created_by = u.id
      WHERE j.status = 'available' 
      AND j.created_by != $1
      ORDER BY j.created_at DESC
    `, [userId]);

    const jobs = jobsQuery.rows;

    // Score and rank jobs
    const scoredJobs = jobs.map(job => {
      let score = 0;
      let matchFactors = [];

      // 1. Route matching for hauliers (40 points max)
      if (userRole === 'haulier' && roleDetails?.preferred_routes) {
        const preferredRoutes = roleDetails.preferred_routes.toLowerCase();
        const origin = job.origin_address.toLowerCase();
        const destination = job.destination_address.toLowerCase();
        
        console.log('=== Route Matching Debug ===');
        console.log('Job:', job.title);
        console.log('Preferred routes:', preferredRoutes);
        console.log('Origin:', origin, '| Destination:', destination);
        
        // Check if both origin and destination are in preferred routes
        const originMatch = preferredRoutes.includes(origin);
        const destinationMatch = preferredRoutes.includes(destination);
        
        console.log('Origin match:', originMatch, '| Destination match:', destinationMatch);
        
        if (originMatch && destinationMatch) {
          // Perfect route match - both cities in preferred routes
          score += 40;
          matchFactors.push(`Perfect route match: ${job.origin_address} → ${job.destination_address}`);
          console.log('✅ Perfect match! +40 points');
        } else if (originMatch || destinationMatch) {
          // Partial match - one city matches
          score += 20;
          matchFactors.push(`Partial route match: passes through ${originMatch ? job.origin_address : job.destination_address}`);
          console.log('✅ Partial match! +20 points');
        }
        console.log('========================\n');
      }

      // 2. Target areas/lanes matching (35 points max)
      if (userRole === 'logistics_company' && roleDetails?.target_lanes) {
        const targetLanes = roleDetails.target_lanes.toLowerCase();
        const origin = job.origin_address.toLowerCase();
        const destination = job.destination_address.toLowerCase();
        
        if (targetLanes.includes(origin) || targetLanes.includes(destination)) {
          score += 35;
          matchFactors.push('Matches target lanes');
        }
      }

      // 3. Fleet size vs job weight for hauliers (25 points max)
      if (userRole === 'haulier' && roleDetails?.fleet_size && job.weight) {
        // Assume larger fleet = can handle heavier loads
        const weightScore = Math.min(25, (roleDetails.fleet_size / 10) * 5);
        score += weightScore;
        matchFactors.push(`Fleet size ${roleDetails.fleet_size} suitable for weight`);
      }

      // 4. Price attractiveness (20 points max)
      if (job.price) {
        // Higher paying jobs get more points
        const priceScore = Math.min(20, (job.price / 100) * 2);
        score += priceScore;
        matchFactors.push(`Competitive price: £${job.price}`);
      }

      // 5. Deadline urgency (15 points max)
      if (job.deadline) {
        const daysUntilDeadline = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          score += 15;
          matchFactors.push(`Urgent: ${daysUntilDeadline} days until deadline`);
        } else if (daysUntilDeadline <= 14) {
          score += 10;
          matchFactors.push(`${daysUntilDeadline} days until deadline`);
        }
      }

      // 6. Distance calculation (informational, small bonus for shorter routes)
      if (job.origin_lat && job.origin_lng && job.destination_lat && job.destination_lng) {
        const distance = calculateDistance(
          job.origin_lat,
          job.origin_lng,
          job.destination_lat,
          job.destination_lng
        );
        
        // Shorter distances get small bonus (10 points max)
        if (distance < 100) {
          score += 10;
          matchFactors.push(`Short distance: ${distance.toFixed(0)} km`);
        } else if (distance < 300) {
          score += 5;
          matchFactors.push(`Medium distance: ${distance.toFixed(0)} km`);
        }
        
        job.distance_km = Math.round(distance);
      }

      // 7. Insurance validity check for hauliers
      if (userRole === 'haulier' && roleDetails?.insurance_valid_until) {
        const insuranceValid = new Date(roleDetails.insurance_valid_until) > new Date();
        if (insuranceValid) {
          score += 5;
          matchFactors.push('Insurance valid');
        }
      }

      // 8. Company specialties matching for logistics companies
      if (userRole === 'logistics_company' && roleDetails?.specialties && job.description) {
        const specialties = roleDetails.specialties.toLowerCase();
        const description = job.description.toLowerCase();
        
        // Check for specialty keywords in job description
        const specialtyKeywords = specialties.split(',').map(s => s.trim());
        const hasMatch = specialtyKeywords.some(keyword => description.includes(keyword));
        
        if (hasMatch) {
          score += 30;
          matchFactors.push('Matches company specialties');
        }
      }

      return {
        ...job,
        match_score: Math.round(score),
        match_factors: matchFactors,
        match_percentage: Math.min(100, Math.round((score / 150) * 100)) // Out of 100%
      };
    });

    // Sort by match score (highest first)
    scoredJobs.sort((a, b) => b.match_score - a.match_score);

    res.json({
      total_jobs: scoredJobs.length,
      user_role: userRole,
      matched_jobs: scoredJobs
    });

  } catch (err) {
    console.error('Error in matching:', err);
    res.status(500).json({ error: 'Failed to fetch matched jobs' });
  }
};

// Get match explanation for a specific job
exports.getJobMatchExplanation = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    // Similar logic as above but for single job
    // This endpoint can provide detailed explanation of why a job matches

    res.json({
      message: 'Match explanation for job',
      job_id: jobId
    });
  } catch (err) {
    console.error('Error getting match explanation:', err);
    res.status(500).json({ error: 'Failed to get match explanation' });
  }
};