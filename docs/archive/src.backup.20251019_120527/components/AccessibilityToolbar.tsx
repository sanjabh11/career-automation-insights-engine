
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Contrast, 
  MousePointer, 
  Keyboard,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  soundEffects: boolean;
}

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    soundEffects: false
  });

  useEffect(() => {
    // Load saved accessibility settings
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }
  }, []);

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    if (settings.reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }

    if (settings.focusIndicators) {
      root.classList.add('accessibility-focus-indicators');
    } else {
      root.classList.remove('accessibility-focus-indicators');
    }

    // Save settings
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const announceChange = (message: string) => {
    if (settings.screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Add CSS styles to head instead of using jsx attribute
  useEffect(() => {
    const styleId = 'accessibility-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .accessibility-high-contrast {
          filter: contrast(1.5);
        }
        
        .accessibility-large-text {
          font-size: 120% !important;
        }
        
        .accessibility-large-text * {
          font-size: inherit !important;
        }
        
        .accessibility-reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .accessibility-focus-indicators *:focus {
          outline: 3px solid #0066cc !important;
          outline-offset: 2px !important;
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-4 h-4" />
        A11y
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 p-4 shadow-lg" onKeyDown={handleKeyDown}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Accessibility Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  <span className="text-sm">High Contrast</span>
                </div>
                <Button
                  variant={settings.highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateSetting('highContrast');
                    announceChange(`High contrast ${!settings.highContrast ? 'enabled' : 'disabled'}`);
                  }}
                  aria-pressed={settings.highContrast}
                >
                  {settings.highContrast ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <span className="text-sm">Large Text</span>
                </div>
                <Button
                  variant={settings.largeText ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateSetting('largeText');
                    announceChange(`Large text ${!settings.largeText ? 'enabled' : 'disabled'}`);
                  }}
                  aria-pressed={settings.largeText}
                >
                  {settings.largeText ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  <span className="text-sm">Reduced Motion</span>
                </div>
                <Button
                  variant={settings.reducedMotion ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateSetting('reducedMotion');
                    announceChange(`Reduced motion ${!settings.reducedMotion ? 'enabled' : 'disabled'}`);
                  }}
                  aria-pressed={settings.reducedMotion}
                >
                  {settings.reducedMotion ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  <span className="text-sm">Focus Indicators</span>
                </div>
                <Button
                  variant={settings.focusIndicators ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateSetting('focusIndicators');
                    announceChange(`Focus indicators ${!settings.focusIndicators ? 'enabled' : 'disabled'}`);
                  }}
                  aria-pressed={settings.focusIndicators}
                >
                  {settings.focusIndicators ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">Screen Reader Support</span>
                </div>
                <Button
                  variant={settings.screenReader ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateSetting('screenReader');
                    announceChange(`Screen reader support ${!settings.screenReader ? 'enabled' : 'disabled'}`);
                  }}
                  aria-pressed={settings.screenReader}
                >
                  {settings.screenReader ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500">
                Settings are automatically saved and will persist across sessions.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
