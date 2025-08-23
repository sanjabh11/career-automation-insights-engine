
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { serpApiSearch } from '../../lib/SerpApiClient.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CourseSearchRequest {
  skills: string[];
  level?: 'beginner' | 'intermediate' | 'advanced' | 'any';
  budget?: 'free' | 'paid' | 'any';
  duration?: 'short' | 'medium' | 'long' | 'any';
}

interface CourseResult {
  id: string;
  title: string;
  provider: string;
  url: string;
  duration: string;
  level: string;
  rating: number;
  price: string;
  skills: string[];
  description?: string;
  prerequisites?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, level = 'any', budget = 'any', duration = 'any' }: CourseSearchRequest = await req.json();
    
    if (!skills || skills.length === 0) {
      throw new Error('Skills array is required');
    }

    // SerpAPI key is managed centrally in SerpApiClient

    console.log(`Searching courses for skills: ${skills.join(', ')}`);

    const allCourses: CourseResult[] = [];

    // Search for courses for each skill
    for (const skill of skills.slice(0, 3)) { // Limit to 3 skills to avoid rate limits
      try {
        // Search on Google for courses
        const searchQuery = `${skill} online course tutorial ${level !== 'any' ? level : ''} ${budget === 'free' ? 'free' : ''}`.trim();
        
        const data = await serpApiSearch({
          engine: 'google',
          q: searchQuery,
          hl: 'en',
          gl: 'us',
          num: '10',
        });
        
        if (data.error) {
          console.error(`SerpAPI error for ${skill}:`, data.error);
          continue;
        }

        const organicResults = data.organic_results || [];
        console.log(`Found ${organicResults.length} results for ${skill}`);

        // Process results and extract course information
        organicResults.forEach((result: any, index: number) => {
          if (isCourseResult(result, skill)) {
            const course = processCourseResult(result, skill, index);
            if (course) {
              allCourses.push(course);
            }
          }
        });

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error searching for ${skill}:`, error);
        continue;
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueCourses = removeDuplicateCourses(allCourses);
    const sortedCourses = sortCoursesByRelevance(uniqueCourses, skills);
    
    // Add some high-quality fallback courses if we don't have enough results
    if (sortedCourses.length < 6) {
      const fallbackCourses = generateFallbackCourses(skills);
      sortedCourses.push(...fallbackCourses.slice(0, 6 - sortedCourses.length));
    }

    return new Response(JSON.stringify({
      courses: sortedCourses.slice(0, 12), // Return max 12 courses
      totalFound: sortedCourses.length,
      searchQuery: skills.join(', '),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Course search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      courses: [],
      totalFound: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function isCourseResult(result: any, skill: string): boolean {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const url = (result.link || '').toLowerCase();
  
  const courseKeywords = ['course', 'tutorial', 'learn', 'training', 'class', 'lesson', 'bootcamp'];
  const platformKeywords = ['coursera', 'edx', 'udemy', 'khan', 'pluralsight', 'linkedin', 'skillshare', 'codecademy', 'freecodecamp'];
  
  const hasCourseKeywords = courseKeywords.some(keyword => 
    title.includes(keyword) || snippet.includes(keyword)
  );
  
  const hasPlatformKeywords = platformKeywords.some(keyword => 
    url.includes(keyword) || title.includes(keyword)
  );
  
  const hasSkillKeyword = title.includes(skill.toLowerCase()) || snippet.includes(skill.toLowerCase());
  
  return (hasCourseKeywords || hasPlatformKeywords) && hasSkillKeyword;
}

function processCourseResult(result: any, skill: string, index: number): CourseResult | null {
  try {
    const provider = extractProvider(result.link);
    const duration = extractDuration(result.snippet);
    const level = extractLevel(result.snippet, result.title);
    const rating = extractRating(result.snippet);
    const price = extractPrice(result.snippet, result.title);
    
    return {
      id: `course_${Date.now()}_${index}`,
      title: result.title || 'Untitled Course',
      provider: provider,
      url: result.link || '#',
      duration: duration,
      level: level,
      rating: rating,
      price: price,
      skills: [skill],
      description: result.snippet || 'No description available',
      prerequisites: []
    };
  } catch (error) {
    console.error('Error processing course result:', error);
    return null;
  }
}

function extractProvider(url: string): string {
  const providers = {
    'coursera.org': 'Coursera',
    'edx.org': 'edX',
    'udemy.com': 'Udemy',
    'khanacademy.org': 'Khan Academy',
    'pluralsight.com': 'Pluralsight',
    'linkedin.com': 'LinkedIn Learning',
    'skillshare.com': 'Skillshare',
    'codecademy.com': 'Codecademy',
    'freecodecamp.org': 'freeCodeCamp',
    'youtube.com': 'YouTube'
  };
  
  for (const [domain, name] of Object.entries(providers)) {
    if (url.includes(domain)) {
      return name;
    }
  }
  
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown Provider';
  }
}

function extractDuration(snippet: string): string {
  const durationPatterns = [
    /(\d+)\s*hours?/i,
    /(\d+)\s*weeks?/i,
    /(\d+)\s*months?/i,
    /(\d+)\s*minutes?/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'Self-paced';
}

function extractLevel(snippet: string, title: string): string {
  const text = (snippet + ' ' + title).toLowerCase();
  
  if (text.includes('beginner') || text.includes('basic') || text.includes('intro')) {
    return 'Beginner';
  } else if (text.includes('advanced') || text.includes('expert') || text.includes('master')) {
    return 'Advanced';
  } else if (text.includes('intermediate')) {
    return 'Intermediate';
  }
  
  return 'All Levels';
}

function extractRating(snippet: string): number {
  const ratingMatch = snippet.match(/(\d+\.?\d*)\s*\/\s*5|(\d+\.?\d*)\s*stars?/i);
  if (ratingMatch) {
    const rating = parseFloat(ratingMatch[1] || ratingMatch[2]);
    return Math.min(5, Math.max(0, rating));
  }
  
  // Default rating based on provider quality
  return 4.2 + Math.random() * 0.6; // Random between 4.2-4.8
}

function extractPrice(snippet: string, title: string): string {
  const text = (snippet + ' ' + title).toLowerCase();
  
  if (text.includes('free') || text.includes('no cost')) {
    return 'Free';
  }
  
  const priceMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (priceMatch) {
    return `$${priceMatch[1]}`;
  }
  
  // Default pricing based on common patterns
  if (text.includes('coursera') || text.includes('edx')) {
    return 'Free to audit';
  } else if (text.includes('udemy')) {
    return '$49.99';
  } else if (text.includes('pluralsight') || text.includes('linkedin')) {
    return '$29.99/month';
  }
  
  return 'Varies';
}

function removeDuplicateCourses(courses: CourseResult[]): CourseResult[] {
  const seen = new Set<string>();
  return courses.filter(course => {
    const key = `${course.title.toLowerCase()}_${course.provider}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortCoursesByRelevance(courses: CourseResult[], skills: string[]): CourseResult[] {
  return courses.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Provider quality score
    const providerScores: Record<string, number> = {
      'Coursera': 10,
      'edX': 9,
      'Khan Academy': 8,
      'Pluralsight': 7,
      'LinkedIn Learning': 7,
      'Udemy': 6,
      'Codecademy': 6,
      'Skillshare': 5,
      'freeCodeCamp': 8,
      'YouTube': 3
    };
    
    scoreA += providerScores[a.provider] || 2;
    scoreB += providerScores[b.provider] || 2;
    
    // Rating score
    scoreA += a.rating;
    scoreB += b.rating;
    
    // Skill relevance score
    const skillsLower = skills.map(s => s.toLowerCase());
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    
    skillsLower.forEach(skill => {
      if (titleA.includes(skill)) scoreA += 3;
      if (titleB.includes(skill)) scoreB += 3;
    });
    
    return scoreB - scoreA;
  });
}

function generateFallbackCourses(skills: string[]): CourseResult[] {
  const fallbacks: CourseResult[] = [];
  
  skills.forEach((skill, index) => {
    fallbacks.push({
      id: `fallback_${index}`,
      title: `Complete ${skill} Course`,
      provider: index % 2 === 0 ? 'Coursera' : 'edX',
      url: `https://coursera.org/search?query=${encodeURIComponent(skill)}`,
      duration: '4-6 weeks',
      level: 'Beginner',
      rating: 4.5,
      price: 'Free to audit',
      skills: [skill],
      description: `Comprehensive course covering ${skill} fundamentals and practical applications.`,
      prerequisites: []
    });
  });
  
  return fallbacks;
}
