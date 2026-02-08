
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ExternalLink, Star, Clock, DollarSign, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { useCareerPlanningStorage, CourseRecommendation } from '@/hooks/useCareerPlanningStorage';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function CourseRecommendationsPanel() {
  const { userSkills, courseRecommendations, saveCourseRecommendations } = useCareerPlanningStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [filteredCourses, setFilteredCourses] = useState<CourseRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchSkills, setLastSearchSkills] = useState<string[]>([]);

  useEffect(() => {
    // Auto-search when user skills change
    if (userSkills.length > 0 && !arraysEqual(userSkills.map(s => s.name), lastSearchSkills)) {
      handleSearchCourses();
    }
  }, [userSkills]);

  useEffect(() => {
    let courses = courseRecommendations;
    
    // Filter by search term
    if (searchTerm) {
      courses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        course.provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by level
    if (selectedLevel !== 'all') {
      courses = courses.filter(course => course.level.toLowerCase() === selectedLevel);
    }
    
    // Filter by provider
    if (selectedProvider !== 'all') {
      courses = courses.filter(course => course.provider === selectedProvider);
    }
    
    setFilteredCourses(courses);
  }, [courseRecommendations, searchTerm, selectedLevel, selectedProvider]);

  const handleSearchCourses = async () => {
    if (userSkills.length === 0) {
      toast.error('Please add some skills first to get course recommendations');
      return;
    }

    setIsLoading(true);
    try {
      const skillNames = userSkills.map(skill => skill.name);
      setLastSearchSkills(skillNames);

      const { data, error } = await supabase.functions.invoke('course-search', {
        body: { 
          skills: skillNames.slice(0, 5), // Limit to 5 skills to avoid API limits
          level: selectedLevel !== 'all' ? selectedLevel : undefined
        }
      });

      if (error) {
        console.error('Course search error:', error);
        toast.error('Failed to search for courses. Please try again.');
        return;
      }

      if (data?.courses && data.courses.length > 0) {
        saveCourseRecommendations(data.courses);
        toast.success(`Found ${data.courses.length} course recommendations!`);
      } else {
        toast.info('No courses found. Try adjusting your search criteria.');
      }

    } catch (error) {
      console.error('Course search error:', error);
      toast.error('Failed to search for courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendedCourses = () => {
    if (userSkills.length === 0) return filteredCourses;
    
    const userSkillNames = userSkills.map(skill => skill.name.toLowerCase());
    
    return filteredCourses.sort((a, b) => {
      const aMatchCount = a.skills.filter(skill => 
        userSkillNames.some(userSkill => 
          skill.toLowerCase().includes(userSkill) || userSkill.includes(skill.toLowerCase())
        )
      ).length;
      
      const bMatchCount = b.skills.filter(skill => 
        userSkillNames.some(userSkill => 
          skill.toLowerCase().includes(userSkill) || userSkill.includes(skill.toLowerCase())
        )
      ).length;
      
      return bMatchCount - aMatchCount;
    });
  };

  const recommendedCourses = getRecommendedCourses();
  const providers = [...new Set(courseRecommendations.map(course => course.provider))];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const arraysEqual = (a: string[], b: string[]) => {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Course Recommendations</h2>
          <p className="text-gray-600">Discover courses tailored to your skill development goals</p>
        </div>
        
        <Button 
          onClick={handleSearchCourses}
          disabled={isLoading || userSkills.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isLoading ? 'Searching...' : 'Search Courses'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Courses
              </label>
              <Input
                placeholder="Search by title, skill, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Level
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Searching for Courses...</h3>
              <p className="text-gray-600">Finding the best learning resources for your skills</p>
            </div>
          </div>
        </Card>
      )}

      {/* Course Grid */}
      {!isLoading && recommendedCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {courseRecommendations.length === 0 ? 'No Courses Found Yet' : 'No Matching Courses'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {courseRecommendations.length === 0 
                  ? 'Add some skills and click "Search Courses" to get personalized recommendations'
                  : 'Try adjusting your search criteria or filters to find relevant courses'
                }
              </p>
            </div>
          </div>
        </Card>
      ) : !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {course.provider}
                      </Badge>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {getRatingStars(course.rating)}
                        <span className="ml-1 font-medium">{course.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">{course.price}</span>
                    </div>
                    
                    {course.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Skills you'll learn:</p>
                      <div className="flex flex-wrap gap-1">
                        {course.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    variant="outline"
                    onClick={() => window.open(course.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Course
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Personalized Recommendations Info */}
      {userSkills.length > 0 && courseRecommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-green-900">Personalized Recommendations</h3>
                <p className="text-green-700 text-sm">
                  These courses are curated based on your skill profile and career goals. 
                  We searched across top platforms like Coursera, edX, Udemy, and more to find the best matches.
                  Click "Search Courses" to refresh recommendations based on your updated skills.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Request */}
      {courseRecommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-blue-900">How are these recommendations?</h3>
              <p className="text-blue-700 text-sm">
                Please let us know if these course recommendations meet your needs or if you prefer other formats. 
                Your feedback helps us improve our suggestions!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
