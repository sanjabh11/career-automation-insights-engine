
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Save, Edit3 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

export function UserProfilePanel() {
  const { profile, updateProfile, isUpdating } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");

  React.useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleSave = async () => {
    try {
      await updateProfile({ full_name: fullName });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-500" />
          <span className="text-gray-500">No profile data available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Profile</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {profile.subscription_tier || 'Free'}
              </Badge>
              {profile.api_credits !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {profile.api_credits} credits
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            {isEditing ? (
              <div className="flex gap-2 mt-1">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={isUpdating}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(profile.full_name || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm bg-gray-50 px-3 py-2 rounded border flex-1">
                  {profile.full_name || "Not set"}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>Account Created</Label>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
