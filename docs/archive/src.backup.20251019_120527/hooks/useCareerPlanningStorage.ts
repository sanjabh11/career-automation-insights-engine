
import { useState, useEffect } from 'react';

export interface UserSkill {
  id: string;
  name: string;
  currentLevel: number;
  targetLevel: number;
  category: string;
  description?: string;
}

export interface SkillGap {
  id: string;
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  gapSize: number;
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface CourseRecommendation {
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

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  skills: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  skills: string[];
  estimatedDuration: string;
  milestones: Milestone[];
  difficulty: string;
  prerequisites: string[];
}

export interface ProgressTracking {
  id: string;
  skillId: string;
  skillName: string;
  initialLevel: number;
  currentLevel: number;
  targetLevel: number;
  progressPercentage: number;
  lastUpdated: string;
  milestones: string[];
  timeSpent: number;
  coursesCompleted: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentRole?: string;
  targetRole?: string;
  experience?: string;
  preferences?: {
    learningStyle?: string;
    timeCommitment?: string;
    budget?: string;
  };
}

const STORAGE_KEYS = {
  USER_SKILLS: 'career_planning_user_skills',
  SKILL_GAPS: 'career_planning_skill_gaps',
  COURSE_RECOMMENDATIONS: 'career_planning_course_recommendations',
  LEARNING_PATHS: 'career_planning_learning_paths',
  PROGRESS_TRACKING: 'career_planning_progress_tracking',
  USER_PROFILE: 'career_planning_user_profile',
};

export function useCareerPlanningStorage() {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [courseRecommendations, setCourseRecommendations] = useState<CourseRecommendation[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [progressTracking, setProgressTracking] = useState<ProgressTracking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedUserSkills = localStorage.getItem(STORAGE_KEYS.USER_SKILLS);
        const storedSkillGaps = localStorage.getItem(STORAGE_KEYS.SKILL_GAPS);
        const storedCourseRecommendations = localStorage.getItem(STORAGE_KEYS.COURSE_RECOMMENDATIONS);
        const storedLearningPaths = localStorage.getItem(STORAGE_KEYS.LEARNING_PATHS);
        const storedProgressTracking = localStorage.getItem(STORAGE_KEYS.PROGRESS_TRACKING);
        const storedUserProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);

        if (storedUserSkills) setUserSkills(JSON.parse(storedUserSkills));
        if (storedSkillGaps) setSkillGaps(JSON.parse(storedSkillGaps));
        if (storedCourseRecommendations) setCourseRecommendations(JSON.parse(storedCourseRecommendations));
        if (storedLearningPaths) setLearningPaths(JSON.parse(storedLearningPaths));
        if (storedProgressTracking) setProgressTracking(JSON.parse(storedProgressTracking));
        if (storedUserProfile) setUserProfile(JSON.parse(storedUserProfile));
      } catch (error) {
        console.error('Error loading career planning data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Save functions
  const saveUserSkills = (skills: UserSkill[]) => {
    setUserSkills(skills);
    localStorage.setItem(STORAGE_KEYS.USER_SKILLS, JSON.stringify(skills));
  };

  const saveSkillGaps = (gaps: SkillGap[]) => {
    setSkillGaps(gaps);
    localStorage.setItem(STORAGE_KEYS.SKILL_GAPS, JSON.stringify(gaps));
  };

  const saveCourseRecommendations = (courses: CourseRecommendation[]) => {
    setCourseRecommendations(courses);
    localStorage.setItem(STORAGE_KEYS.COURSE_RECOMMENDATIONS, JSON.stringify(courses));
  };

  const saveLearningPaths = (paths: LearningPath[]) => {
    setLearningPaths(paths);
    localStorage.setItem(STORAGE_KEYS.LEARNING_PATHS, JSON.stringify(paths));
  };

  const saveProgressTracking = (progress: ProgressTracking[]) => {
    setProgressTracking(progress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS_TRACKING, JSON.stringify(progress));
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  };

  // Helper functions
  const addUserSkill = (skill: Omit<UserSkill, 'id'>) => {
    const newSkill: UserSkill = {
      ...skill,
      id: `skill_${Date.now()}`,
    };
    saveUserSkills([...userSkills, newSkill]);
  };

  const updateUserSkill = (skillId: string, updates: Partial<UserSkill>) => {
    const updatedSkills = userSkills.map(skill =>
      skill.id === skillId ? { ...skill, ...updates } : skill
    );
    saveUserSkills(updatedSkills);
  };

  const removeUserSkill = (skillId: string) => {
    const filteredSkills = userSkills.filter(skill => skill.id !== skillId);
    saveUserSkills(filteredSkills);
  };

  const addLearningPath = (path: Omit<LearningPath, 'id'>) => {
    const newPath: LearningPath = {
      ...path,
      id: `path_${Date.now()}`,
    };
    saveLearningPaths([...learningPaths, newPath]);
  };

  const updateProgressTracking = (skillId: string, progressPercentage: number) => {
    const skill = userSkills.find(s => s.id === skillId);
    if (!skill) return;

    const existingProgress = progressTracking.find(p => p.skillId === skillId);
    
    if (existingProgress) {
      const updatedProgress = progressTracking.map(p =>
        p.skillId === skillId
          ? { ...p, progressPercentage, lastUpdated: new Date().toISOString() }
          : p
      );
      saveProgressTracking(updatedProgress);
    } else {
      const newProgress: ProgressTracking = {
        id: `progress_${Date.now()}`,
        skillId,
        skillName: skill.name,
        initialLevel: skill.currentLevel,
        currentLevel: skill.currentLevel,
        targetLevel: skill.targetLevel,
        progressPercentage,
        lastUpdated: new Date().toISOString(),
        milestones: [],
        timeSpent: 0,
        coursesCompleted: [],
      };
      saveProgressTracking([...progressTracking, newProgress]);
    }
  };

  const updateSkillProgress = (skillId: string, newLevel: number, hoursSpent: number) => {
    const skill = userSkills.find(s => s.id === skillId);
    if (!skill) return;

    // Update skill current level
    updateUserSkill(skillId, { currentLevel: newLevel });

    // Update progress tracking
    const existingProgress = progressTracking.find(p => p.skillId === skillId);
    const progressPercentage = Math.min(100, (newLevel / skill.targetLevel) * 100);
    
    if (existingProgress) {
      const updatedProgress = progressTracking.map(p =>
        p.skillId === skillId
          ? { 
              ...p, 
              currentLevel: newLevel,
              progressPercentage,
              timeSpent: p.timeSpent + hoursSpent,
              lastUpdated: new Date().toISOString() 
            }
          : p
      );
      saveProgressTracking(updatedProgress);
    } else {
      const newProgress: ProgressTracking = {
        id: `progress_${Date.now()}`,
        skillId,
        skillName: skill.name,
        initialLevel: skill.currentLevel,
        currentLevel: newLevel,
        targetLevel: skill.targetLevel,
        progressPercentage,
        lastUpdated: new Date().toISOString(),
        milestones: [],
        timeSpent: hoursSpent,
        coursesCompleted: [],
      };
      saveProgressTracking([...progressTracking, newProgress]);
    }
  };

  const analyzeSkillGaps = (skills: UserSkill[]): SkillGap[] => {
    return skills
      .filter(skill => skill.currentLevel < skill.targetLevel)
      .map(skill => {
        const gap = skill.targetLevel - skill.currentLevel;
        const gapSize = gap;
        let priority: 'high' | 'medium' | 'low' = 'low';
        
        if (gap >= 3) priority = 'high';
        else if (gap >= 2) priority = 'medium';

        const recommendations = [
          `Focus on practical exercises to improve ${skill.name}`,
          `Consider taking online courses in ${skill.name}`,
          `Practice ${skill.name} through real-world projects`,
        ];

        return {
          id: `gap_${skill.id}`,
          skillId: skill.id,
          skillName: skill.name,
          currentLevel: skill.currentLevel,
          targetLevel: skill.targetLevel,
          gap,
          gapSize,
          priority,
          recommendations,
        };
      });
  };

  return {
    // Data
    userSkills,
    skillGaps,
    courseRecommendations,
    learningPaths,
    progressTracking,
    userProfile,
    isLoading,
    
    // Save functions
    saveUserSkills,
    saveSkillGaps,
    saveCourseRecommendations,
    saveLearningPaths,
    saveProgressTracking,
    saveUserProfile,
    
    // Helper functions
    addUserSkill,
    updateUserSkill,
    removeUserSkill,
    addLearningPath,
    updateProgressTracking,
    updateSkillProgress,
    analyzeSkillGaps,
  };
}
