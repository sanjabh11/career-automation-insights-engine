
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Star, TrendingUp } from 'lucide-react';
import { useCareerPlanningStorage, UserSkill } from '@/hooks/useCareerPlanningStorage';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SKILL_CATEGORIES = [
  'Technical',
  'Leadership',
  'Communication',
  'Project Management',
  'Data Analysis',
  'Design',
  'Marketing',
  'Sales',
  'Other'
];

const SKILL_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Just starting out' },
  { value: 2, label: 'Basic', description: 'Some experience' },
  { value: 3, label: 'Intermediate', description: 'Good understanding' },
  { value: 4, label: 'Advanced', description: 'Strong expertise' },
  { value: 5, label: 'Expert', description: 'Industry leader' }
];

export function SkillsManagementPanel() {
  const { userSkills, saveUserSkills, saveLearningPaths, learningPaths } = useCareerPlanningStorage();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [newSkill, setNewSkill] = useState({
    name: '',
    currentLevel: 1,
    targetLevel: 3,
    category: 'Technical'
  });

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    const skill: UserSkill = {
      id: Date.now().toString(),
      name: newSkill.name.trim(),
      currentLevel: newSkill.currentLevel,
      targetLevel: newSkill.targetLevel,
      category: newSkill.category
    };

    const updatedSkills = [...userSkills, skill];
    saveUserSkills(updatedSkills);
    
    setNewSkill({ name: '', currentLevel: 1, targetLevel: 3, category: 'Technical' });
    setIsAddingSkill(false);
    toast.success('Skill added successfully!');
  };

  const handleUpdateSkill = (updatedSkill: UserSkill) => {
    const updatedSkills = userSkills.map(skill =>
      skill.id === updatedSkill.id ? updatedSkill : skill
    );
    saveUserSkills(updatedSkills);
    setEditingSkill(null);
    toast.success('Skill updated successfully!');
  };

  const handleDeleteSkill = (skillId: string) => {
    const updatedSkills = userSkills.filter(skill => skill.id !== skillId);
    saveUserSkills(updatedSkills);
    toast.success('Skill deleted successfully!');
  };

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Skills Management</h2>
          <p className="text-gray-600">Manage your current skills and set target levels for improvement</p>
        </div>
        
        <Dialog open={isAddingSkill} onOpenChange={setIsAddingSkill}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skillName">Skill Name</Label>
                <Input
                  id="skillName"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="e.g., React, Leadership, Data Analysis"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newSkill.category}
                  onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Level</Label>
                  <Select
                    value={newSkill.currentLevel.toString()}
                    onValueChange={(value) => setNewSkill({ ...newSkill, currentLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Target Level</Label>
                  <Select
                    value={newSkill.targetLevel.toString()}
                    onValueChange={(value) => setNewSkill({ ...newSkill, targetLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddSkill} className="flex-1">
                  Add Skill
                </Button>
                <Button variant="outline" onClick={() => setIsAddingSkill(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skills Grid */}
      {userSkills.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">No Skills Added Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start building your skill profile by adding your current abilities and setting improvement targets
              </p>
            </div>
            <Button 
              onClick={() => setIsAddingSkill(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Skill
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userSkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {skill.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {skill.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSkill(skill)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Level</span>
                      <Badge className={getLevelColor(skill.currentLevel)}>
                        Level {skill.currentLevel}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Target Level</span>
                      <Badge className={getLevelColor(skill.targetLevel)}>
                        Level {skill.targetLevel}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {Math.round(getProgressPercentage(skill.currentLevel, skill.targetLevel))}%
                        </span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(skill.currentLevel, skill.targetLevel)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  {skill.targetLevel > skill.currentLevel && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">
                        {skill.targetLevel - skill.currentLevel} levels to improve
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Skill Dialog */}
      {editingSkill && (
        <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editSkillName">Skill Name</Label>
                <Input
                  id="editSkillName"
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingSkill.category}
                  onValueChange={(value) => setEditingSkill({ ...editingSkill, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Level</Label>
                  <Select
                    value={editingSkill.currentLevel.toString()}
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, currentLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Target Level</Label>
                  <Select
                    value={editingSkill.targetLevel.toString()}
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, targetLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleUpdateSkill(editingSkill)} className="flex-1">
                  Update Skill
                </Button>
                <Button variant="outline" onClick={() => setEditingSkill(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
