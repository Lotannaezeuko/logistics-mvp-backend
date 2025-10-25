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

// Check if a route matches based on actual route pairs
function checkRouteMatch(preferredRoutes, origin, destination) {
  // Split routes by comma and normalize
  const routes = preferredRoutes.split(',').map(r => r.trim().toLowerCase());
  
  origin = origin.toLowerCase().trim();
  destination = destination.toLowerCase().trim();
  
  for (const route of routes) {
    // Check for "A to B" format
    const parts = route.split(/\s+to\s+/).map(p => p.trim());
    
    if (parts.length === 2) {
      const [routeOrigin, routeDestination] = parts;
      
      // Perfect match: exact route
      if (routeOrigin === origin && routeDestination === destination) {
        return { type: 'perfect', route };
      }
      
      // Reverse match: B to A when route says A to B
      if (routeOrigin === destination && routeDestination === origin) {
        return { type: 'reverse', route };
      }
    }
  }
  
  // Check for partial matches (only one city matches)
  for (const route of routes) {
    const routeLower = route.toLowerCase();
    if (routeLower.includes(origin) || routeLower.includes(destination)) {
      return { type: 'partial', route };
    }
  }
  
  return { type: 'none' };
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

      // 1. Route matching for hauliers (70 points max - DOMINANT FACTOR)
      if (userRole === 'haulier' && roleDetails?.preferred_routes) {
        console.log('\n=== Route Matching Debug ===');
        console.log('Job:', job.title);
        console.log('Origin:', job.origin_address, '| Destination:', job.destination_address);
        console.log('Preferred routes:', roleDetails.preferred_routes);
        
        const routeMatch = checkRouteMatch(
          roleDetails.preferred_routes,
          job.origin_address,
          job.destination_address
        );
        
        console.log('Match result:', routeMatch);
        
        if (routeMatch.type === 'perfect') {
          score += 70;
          matchFactors.push(`Perfect route: ${job.origin_address} → ${job.destination_address}`);
          console.log('✅ Perfect match! +70 points');
        } else if (routeMatch.type === 'reverse') {
          score += 60;
          matchFactors.push(`Return route: ${job.destination_address} → ${job.origin_address}`);
          console.log('✅ Reverse match! +60 points');
        } else if (routeMatch.type === 'partial') {
          score += 10;
          matchFactors.push(`Near preferred area`);
          console.log('⚠️ Partial match! +10 points');
        } else {
          console.log('❌ No match');
        }
        console.log('========================\n');
      }

      // 2. Target areas/lanes matching for logistics companies (60 points max)
      if (userRole === 'logistics_company' && roleDetails?.target_lanes) {
        const targetLanes = roleDetails.target_lanes.toLowerCase();
        const origin = job.origin_address.toLowerCase();
        const destination = job.destination_address.toLowerCase();
        
        const originMatch = targetLanes.includes(origin);
        const destinationMatch = targetLanes.includes(destination);
        
        if (originMatch && destinationMatch) {
          score += 60;
          matchFactors.push(`Both cities in target lanes`);
        } else if (originMatch || destinationMatch) {
          score += 30;
          matchFactors.push(`One city in target lanes`);
        }
      }

      // 3. Fleet size vs job weight for hauliers (15 points max)
      if (userRole === 'haulier' && roleDetails?.fleet_size && job.weight) {
        // Larger fleet = can handle heavier loads
        const weightScore = Math.min(15, (roleDetails.fleet_size / 10) * 3);
        score += weightScore;
        if (weightScore >= 10) {
          matchFactors.push(`Fleet size suitable for ${job.weight}kg`);
        }
      }

      // 4. Price attractiveness (10 points max - reduced)
      if (job.price) {
        const priceScore = Math.min(10, (job.price / 200) * 2);
        score += priceScore;
        if (job.price >= 800) {
          matchFactors.push(`High value job: £${job.price}`);
        }
      }

      // 5. Deadline urgency (15 points max)
      if (job.deadline) {
        const daysUntilDeadline = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          score += 15;
          matchFactors.push(`Urgent: ${daysUntilDeadline} days`);
        } else if (daysUntilDeadline <= 14) {
          score += 10;
          matchFactors.push(`${daysUntilDeadline} days deadline`);
        }
      }

      // 6. Distance calculation (5 points max - reduced significantly)
      if (job.origin_lat && job.origin_lng && job.destination_lat && job.destination_lng) {
        const distance = calculateDistance(
          job.origin_lat,
          job.origin_lng,
          job.destination_lat,
          job.destination_lng
        );
        
        // Only small bonus for very short distances
        if (distance < 50) {
          score += 5;
          matchFactors.push(`Very short: ${distance.toFixed(0)}km`);
        } else if (distance < 100) {
          score += 3;
        }
        
        job.distance_km = Math.round(distance);
      }

      // 7. Insurance validity check for hauliers (5 points)
      if (userRole === 'haulier' && roleDetails?.insurance_valid_until) {
        const insuranceValid = new Date(roleDetails.insurance_valid_until) > new Date();
        if (insuranceValid) {
          score += 5;
          matchFactors.push('Insurance valid');
        }
      }

      // 8. Company specialties matching for logistics companies (40 points)
      if (userRole === 'logistics_company' && roleDetails?.specialties && job.description) {
        const specialties = roleDetails.specialties.toLowerCase();
        const description = job.description.toLowerCase();
        
        const specialtyKeywords = specialties.split(',').map(s => s.trim());
        const hasMatch = specialtyKeywords.some(keyword => 
          description.includes(keyword) || job.title.toLowerCase().includes(keyword)
        );
        
        if (hasMatch) {
          score += 40;
          matchFactors.push('Matches company specialties');
        }
      }

      return {
        ...job,
        match_score: Math.round(score),
        match_factors: matchFactors,
        match_percentage: Math.min(100, Math.round((score / 100) * 100))
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

    res.json({
      message: 'Match explanation for job',
      job_id: jobId
    });
  } catch (err) {
    console.error('Error getting match explanation:', err);
    res.status(500).json({ error: 'Failed to get match explanation' });
  }
};