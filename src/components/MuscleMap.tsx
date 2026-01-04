'use client';

import { cn } from '@/lib/utils';

interface MuscleMapProps {
  highlightedMuscles: string[];
  className?: string;
}

// Anatomically accurate muscle paths - Front View
const FRONT_MUSCLES: Record<string, { paths: string[]; label: string }> = {
  // Neck
  neck: {
    paths: [
      "M 47 18 Q 50 16 53 18 L 54 24 Q 50 25 46 24 Z",
    ],
    label: "Neck"
  },
  // Trapezius (front portion visible)
  traps: {
    paths: [
      "M 38 24 Q 44 22 50 24 Q 56 22 62 24 L 60 30 Q 50 28 40 30 Z",
    ],
    label: "Traps"
  },
  // Shoulders / Deltoids
  shoulders: {
    paths: [
      // Left deltoid
      "M 32 28 Q 28 32 28 38 Q 30 42 34 44 L 38 40 Q 40 34 38 28 Q 35 26 32 28",
      // Right deltoid  
      "M 68 28 Q 72 32 72 38 Q 70 42 66 44 L 62 40 Q 60 34 62 28 Q 65 26 68 28",
    ],
    label: "Deltoids"
  },
  // Chest / Pectorals
  chest: {
    paths: [
      // Left pec
      "M 38 30 Q 42 28 50 32 L 50 38 Q 46 44 38 44 Q 34 42 34 38 Q 34 34 38 30",
      // Right pec
      "M 62 30 Q 58 28 50 32 L 50 38 Q 54 44 62 44 Q 66 42 66 38 Q 66 34 62 30",
    ],
    label: "Chest"
  },
  // Biceps
  biceps: {
    paths: [
      // Left bicep
      "M 30 44 Q 28 48 28 54 Q 30 60 34 62 L 38 58 Q 38 52 36 46 Q 34 44 30 44",
      // Right bicep
      "M 70 44 Q 72 48 72 54 Q 70 60 66 62 L 62 58 Q 62 52 64 46 Q 66 44 70 44",
    ],
    label: "Biceps"
  },
  // Forearms
  forearms: {
    paths: [
      // Left forearm
      "M 28 62 Q 26 68 26 76 Q 28 82 32 84 L 36 78 Q 36 70 34 64 Q 32 62 28 62",
      // Right forearm
      "M 72 62 Q 74 68 74 76 Q 72 82 68 84 L 64 78 Q 64 70 66 64 Q 68 62 72 62",
    ],
    label: "Forearms"
  },
  // Serratus
  serratus: {
    paths: [
      // Left serratus
      "M 36 44 L 40 46 L 40 54 L 36 52 Z",
      // Right serratus
      "M 64 44 L 60 46 L 60 54 L 64 52 Z",
    ],
    label: "Serratus"
  },
  // Abs / Rectus Abdominis
  abs: {
    paths: [
      // Upper abs
      "M 44 44 L 56 44 L 56 52 Q 50 54 44 52 Z",
      // Mid abs
      "M 44 54 Q 50 56 56 54 L 56 62 Q 50 64 44 62 Z",
      // Lower abs
      "M 44 64 Q 50 66 56 64 L 56 72 Q 50 74 44 72 Z",
    ],
    label: "Abs"
  },
  // Obliques
  obliques: {
    paths: [
      // Left oblique
      "M 38 46 L 44 48 L 44 70 L 40 72 Q 36 68 36 58 Q 36 50 38 46",
      // Right oblique
      "M 62 46 L 56 48 L 56 70 L 60 72 Q 64 68 64 58 Q 64 50 62 46",
    ],
    label: "Obliques"
  },
  // Hip Flexors
  hipflexors: {
    paths: [
      "M 42 72 L 50 74 L 58 72 L 56 78 Q 50 80 44 78 Z",
    ],
    label: "Hip Flexors"
  },
  // Quadriceps
  quads: {
    paths: [
      // Left quad - outer sweep
      "M 38 78 Q 34 88 34 100 Q 36 112 40 118 L 46 116 Q 46 104 46 92 Q 44 82 42 78 L 38 78",
      // Left quad - inner
      "M 46 80 L 50 82 L 50 116 L 46 118 L 46 92 Q 46 86 46 80",
      // Right quad - inner
      "M 54 80 L 50 82 L 50 116 L 54 118 L 54 92 Q 54 86 54 80",
      // Right quad - outer sweep
      "M 62 78 Q 66 88 66 100 Q 64 112 60 118 L 54 116 Q 54 104 54 92 Q 56 82 58 78 L 62 78",
    ],
    label: "Quadriceps"
  },
  // Adductors (inner thigh)
  adductors: {
    paths: [
      // Left adductor
      "M 46 80 Q 48 82 50 84 L 50 110 Q 48 108 46 106 L 46 80",
      // Right adductor
      "M 54 80 Q 52 82 50 84 L 50 110 Q 52 108 54 106 L 54 80",
    ],
    label: "Adductors"
  },
  // Tibialis (front of shin)
  tibialis: {
    paths: [
      // Left tibialis
      "M 40 120 Q 38 130 38 140 Q 40 150 42 154 L 46 152 Q 46 142 46 132 Q 44 124 42 120 L 40 120",
      // Right tibialis
      "M 60 120 Q 62 130 62 140 Q 60 150 58 154 L 54 152 Q 54 142 54 132 Q 56 124 58 120 L 60 120",
    ],
    label: "Tibialis"
  },
  // Calves (front view - partial)
  calves: {
    paths: [
      // Left calf
      "M 36 122 Q 34 132 36 142 Q 38 148 40 150 L 42 146 Q 40 138 40 130 Q 40 126 38 122 L 36 122",
      // Right calf
      "M 64 122 Q 66 132 64 142 Q 62 148 60 150 L 58 146 Q 60 138 60 130 Q 60 126 62 122 L 64 122",
    ],
    label: "Calves"
  },
};

// Anatomically accurate muscle paths - Back View  
const BACK_MUSCLES: Record<string, { paths: string[]; label: string }> = {
  // Neck (back)
  neck: {
    paths: [
      "M 147 18 Q 150 16 153 18 L 154 24 Q 150 25 146 24 Z",
    ],
    label: "Neck"
  },
  // Trapezius
  traps: {
    paths: [
      // Upper traps
      "M 138 22 Q 150 18 162 22 L 160 32 Q 150 28 140 32 Z",
      // Mid traps  
      "M 140 32 Q 150 30 160 32 L 158 44 Q 150 42 142 44 Z",
    ],
    label: "Trapezius"
  },
  // Rear Deltoids
  shoulders: {
    paths: [
      // Left rear delt
      "M 132 28 Q 128 34 130 42 Q 132 46 136 46 L 140 40 Q 140 32 136 28 L 132 28",
      // Right rear delt
      "M 168 28 Q 172 34 170 42 Q 168 46 164 46 L 160 40 Q 160 32 164 28 L 168 28",
    ],
    label: "Rear Delts"
  },
  // Rhomboids
  rhomboids: {
    paths: [
      "M 142 34 L 150 36 L 158 34 L 156 48 Q 150 50 144 48 Z",
    ],
    label: "Rhomboids"
  },
  // Infraspinatus / Rotator Cuff area
  rotatorCuff: {
    paths: [
      // Left
      "M 136 36 L 142 38 L 142 48 L 136 46 Q 134 42 136 36",
      // Right
      "M 164 36 L 158 38 L 158 48 L 164 46 Q 166 42 164 36",
    ],
    label: "Rotator Cuff"
  },
  // Triceps
  triceps: {
    paths: [
      // Left tricep - long head
      "M 130 44 Q 128 52 130 60 Q 132 64 136 64 L 138 58 Q 138 50 136 46 L 130 44",
      // Left tricep - lateral head
      "M 136 44 L 140 46 L 140 58 L 136 60 Q 134 54 136 44",
      // Right tricep - long head
      "M 170 44 Q 172 52 170 60 Q 168 64 164 64 L 162 58 Q 162 50 164 46 L 170 44",
      // Right tricep - lateral head
      "M 164 44 L 160 46 L 160 58 L 164 60 Q 166 54 164 44",
    ],
    label: "Triceps"
  },
  // Lats / Latissimus Dorsi
  lats: {
    paths: [
      // Left lat
      "M 136 46 Q 132 56 134 68 L 142 72 L 144 52 Q 142 46 136 46",
      // Right lat
      "M 164 46 Q 168 56 166 68 L 158 72 L 156 52 Q 158 46 164 46",
    ],
    label: "Lats"
  },
  // Erector Spinae / Lower Back
  lowerBack: {
    paths: [
      // Left erector
      "M 144 50 L 150 52 L 150 72 L 146 74 Q 142 66 144 50",
      // Right erector
      "M 156 50 L 150 52 L 150 72 L 154 74 Q 158 66 156 50",
    ],
    label: "Lower Back"
  },
  back: {
    paths: [
      // General back - combines with lats/erectors for matching
      "M 140 44 L 160 44 L 162 70 Q 150 74 138 70 Z",
    ],
    label: "Back"
  },
  // Forearms (back view)
  forearms: {
    paths: [
      // Left forearm
      "M 126 64 Q 124 72 126 80 Q 128 84 132 84 L 136 78 Q 136 70 134 66 L 126 64",
      // Right forearm
      "M 174 64 Q 176 72 174 80 Q 172 84 168 84 L 164 78 Q 164 70 166 66 L 174 64",
    ],
    label: "Forearms"
  },
  // Glutes
  glutes: {
    paths: [
      // Left glute
      "M 140 72 Q 136 78 138 88 Q 142 94 150 94 L 150 76 Q 146 74 140 72",
      // Right glute
      "M 160 72 Q 164 78 162 88 Q 158 94 150 94 L 150 76 Q 154 74 160 72",
    ],
    label: "Glutes"
  },
  // Hamstrings
  hamstrings: {
    paths: [
      // Left hamstring - bicep femoris
      "M 136 94 Q 134 106 136 118 L 142 120 Q 142 108 142 98 L 136 94",
      // Left hamstring - semitendinosus
      "M 142 94 L 150 96 L 150 120 L 146 120 Q 144 108 142 94",
      // Right hamstring - semitendinosus
      "M 158 94 L 150 96 L 150 120 L 154 120 Q 156 108 158 94",
      // Right hamstring - bicep femoris
      "M 164 94 Q 166 106 164 118 L 158 120 Q 158 108 158 98 L 164 94",
    ],
    label: "Hamstrings"
  },
  // Calves / Gastrocnemius
  calves: {
    paths: [
      // Left calf - medial head
      "M 140 122 Q 138 132 140 142 Q 142 148 146 150 L 150 146 Q 150 136 148 126 L 140 122",
      // Left calf - lateral head
      "M 136 124 Q 134 134 136 144 Q 138 150 142 152 L 144 148 Q 142 138 140 128 L 136 124",
      // Right calf - medial head
      "M 160 122 Q 162 132 160 142 Q 158 148 154 150 L 150 146 Q 150 136 152 126 L 160 122",
      // Right calf - lateral head
      "M 164 124 Q 166 134 164 144 Q 162 150 158 152 L 156 148 Q 158 138 160 128 L 164 124",
    ],
    label: "Calves"
  },
  // Achilles area
  achilles: {
    paths: [
      // Left
      "M 142 150 Q 144 156 146 162 L 144 164 Q 140 158 142 150",
      // Right
      "M 158 150 Q 156 156 154 162 L 156 164 Q 160 158 158 150",
    ],
    label: "Achilles"
  },
};

// Normalize muscle names for matching
const normalize = (s: string) => s.toLowerCase().trim().replace(/[-_\s]+/g, '');

// Muscle name aliases for better matching
const MUSCLE_ALIASES: Record<string, string[]> = {
  chest: ['pecs', 'pectorals', 'pec'],
  shoulders: ['delts', 'deltoids', 'shoulder', 'rear delts', 'front delts', 'side delts'],
  biceps: ['bicep', 'arms'],
  triceps: ['tricep'],
  forearms: ['forearm', 'wrist'],
  abs: ['core', 'abdominals', 'sixpack', 'rectus'],
  obliques: ['oblique', 'side abs'],
  quads: ['quadriceps', 'quad', 'thighs', 'legs', 'thigh'],
  hamstrings: ['hamstring', 'hams'],
  calves: ['calf', 'gastrocnemius', 'soleus'],
  glutes: ['glute', 'gluteus', 'butt', 'buttocks'],
  back: ['upper back', 'mid back'],
  lats: ['lat', 'latissimus', 'wings'],
  traps: ['trapezius', 'trap'],
  lowerBack: ['lower back', 'erectors', 'spinal erectors', 'lumbar'],
  neck: ['sternocleidomastoid'],
  adductors: ['adductor', 'inner thigh', 'groin'],
  tibialis: ['shin', 'shins'],
  serratus: ['serratus anterior'],
  rhomboids: ['rhomboid'],
  rotatorCuff: ['rotator cuff', 'infraspinatus', 'supraspinatus'],
  hipflexors: ['hip flexors', 'hip flexor', 'psoas', 'iliopsoas'],
};

export default function MuscleMap({ highlightedMuscles, className }: MuscleMapProps) {
  const activeMuscles = highlightedMuscles.map(normalize);

  const isActive = (muscle: string) => {
    const normalizedMuscle = normalize(muscle);
    
    // Direct match
    if (activeMuscles.includes(normalizedMuscle)) return true;
    
    // Check aliases
    const aliases = MUSCLE_ALIASES[muscle] || [];
    for (const alias of aliases) {
      if (activeMuscles.includes(normalize(alias))) return true;
    }
    
    // Partial match (e.g., "upper chest" matches "chest")
    return activeMuscles.some(m => 
      m.includes(normalizedMuscle) || normalizedMuscle.includes(m)
    );
  };

  const renderMusclePaths = (
    muscles: Record<string, { paths: string[]; label: string }>,
    gradientPrefix: string
  ) => {
    return Object.entries(muscles).map(([name, { paths }]) => {
      const active = isActive(name);
      return paths.map((d, i) => (
        <path
          key={`${name}-${i}`}
          d={d}
          className={cn(
            "transition-all duration-700 ease-out",
            active 
              ? "opacity-100" 
              : "opacity-30"
          )}
          fill={active ? `url(#${gradientPrefix}-active-gradient)` : `url(#${gradientPrefix}-inactive-gradient)`}
          stroke={active ? "rgba(251, 113, 133, 0.8)" : "rgba(82, 82, 91, 0.5)"}
          strokeWidth={active ? "0.8" : "0.3"}
          filter={active ? `url(#${gradientPrefix}-glow)` : undefined}
        />
      ));
    });
  };

  return (
    <div className={cn("relative flex items-center justify-center gap-2 sm:gap-4", className)}>
      {/* Front View */}
      <div className="relative flex flex-col items-center">
        <svg 
          viewBox="20 10 60 160" 
          className="w-full max-w-[53.84px] sm:max-w-[69.23px] h-auto"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
        >
          <defs>
            {/* Active muscle gradient */}
            <linearGradient id="front-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            
            {/* Inactive muscle gradient */}
            <linearGradient id="front-inactive-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
            
            {/* Body gradient */}
            <linearGradient id="front-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1c1c1e" />
              <stop offset="50%" stopColor="#141416" />
              <stop offset="100%" stopColor="#0c0c0e" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="front-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Subtle inner shadow for depth */}
            <filter id="front-inner-shadow">
              <feOffset dx="0" dy="1"/>
              <feGaussianBlur stdDeviation="1"/>
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
              <feBlend in2="SourceGraphic" mode="normal"/>
            </filter>
          </defs>
          
          {/* Body Silhouette - Anatomically detailed */}
          <g filter="url(#front-inner-shadow)">
            {/* Head */}
            <ellipse cx="50" cy="12" rx="6" ry="7" fill="url(#front-body-gradient)" stroke="#2a2a2e" strokeWidth="0.5"/>
            
            {/* Neck */}
            <path d="M 46 18 L 54 18 L 54 24 L 46 24 Z" fill="url(#front-body-gradient)" stroke="#2a2a2e" strokeWidth="0.3"/>
            
            {/* Torso */}
            <path 
              d="M 34 26 
                 Q 28 30 28 38 
                 L 26 62 
                 Q 24 74 28 78 
                 L 34 78 
                 Q 40 76 46 78 
                 L 50 80 
                 L 54 78 
                 Q 60 76 66 78 
                 L 72 78 
                 Q 76 74 74 62 
                 L 72 38 
                 Q 72 30 66 26 
                 Q 58 24 50 24 
                 Q 42 24 34 26 Z" 
              fill="url(#front-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Left Arm */}
            <path 
              d="M 28 38 
                 Q 24 44 24 54 
                 Q 22 66 24 78 
                 Q 26 86 32 88 
                 L 38 84 
                 Q 40 74 38 62 
                 Q 38 50 36 44 
                 Q 34 40 30 38 Z" 
              fill="url(#front-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Right Arm */}
            <path 
              d="M 72 38 
                 Q 76 44 76 54 
                 Q 78 66 76 78 
                 Q 74 86 68 88 
                 L 62 84 
                 Q 60 74 62 62 
                 Q 62 50 64 44 
                 Q 66 40 70 38 Z" 
              fill="url(#front-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Left Leg */}
            <path 
              d="M 34 78 
                 Q 30 90 30 106 
                 Q 30 122 34 138 
                 Q 36 152 40 164 
                 L 48 164 
                 Q 50 152 50 138 
                 Q 50 122 50 106 
                 Q 50 90 50 80 
                 Q 44 78 34 78 Z" 
              fill="url(#front-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Right Leg */}
            <path 
              d="M 66 78 
                 Q 70 90 70 106 
                 Q 70 122 66 138 
                 Q 64 152 60 164 
                 L 52 164 
                 Q 50 152 50 138 
                 Q 50 122 50 106 
                 Q 50 90 50 80 
                 Q 56 78 66 78 Z" 
              fill="url(#front-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
          </g>
          
          {/* Muscle Groups */}
          <g>
            {renderMusclePaths(FRONT_MUSCLES, 'front')}
          </g>
          
          {/* Label */}
          <text 
            x="50" 
            y="174" 
            textAnchor="middle" 
            className="text-[6px] uppercase tracking-[0.2em] font-medium"
            fill="#71717a"
          >
            Front
          </text>
        </svg>
      </div>

      {/* Divider */}
      <div className="w-px h-13.33 bg-gradient-to-b from-transparent via-zinc-700 to-transparent opacity-50" />

      {/* Back View */}
      <div className="relative flex flex-col items-center">
        <svg 
          viewBox="120 10 60 160" 
          className="w-full max-w-[53.84px] sm:max-w-[69.23px] h-auto"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
        >
          <defs>
            {/* Active muscle gradient */}
            <linearGradient id="back-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            
            {/* Inactive muscle gradient */}
            <linearGradient id="back-inactive-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
            
            {/* Body gradient */}
            <linearGradient id="back-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1c1c1e" />
              <stop offset="50%" stopColor="#141416" />
              <stop offset="100%" stopColor="#0c0c0e" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="back-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Subtle inner shadow for depth */}
            <filter id="back-inner-shadow">
              <feOffset dx="0" dy="1"/>
              <feGaussianBlur stdDeviation="1"/>
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
              <feBlend in2="SourceGraphic" mode="normal"/>
            </filter>
          </defs>
          
          {/* Body Silhouette - Anatomically detailed */}
          <g filter="url(#back-inner-shadow)">
            {/* Head */}
            <ellipse cx="150" cy="12" rx="6" ry="7" fill="url(#back-body-gradient)" stroke="#2a2a2e" strokeWidth="0.5"/>
            
            {/* Neck */}
            <path d="M 146 18 L 154 18 L 154 24 L 146 24 Z" fill="url(#back-body-gradient)" stroke="#2a2a2e" strokeWidth="0.3"/>
            
            {/* Torso */}
            <path 
              d="M 134 26 
                 Q 128 30 128 38 
                 L 126 62 
                 Q 124 74 128 78 
                 L 134 78 
                 Q 140 76 146 78 
                 L 150 80 
                 L 154 78 
                 Q 160 76 166 78 
                 L 172 78 
                 Q 176 74 174 62 
                 L 172 38 
                 Q 172 30 166 26 
                 Q 158 24 150 24 
                 Q 142 24 134 26 Z" 
              fill="url(#back-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Left Arm */}
            <path 
              d="M 128 38 
                 Q 124 44 124 54 
                 Q 122 66 124 78 
                 Q 126 86 132 88 
                 L 138 84 
                 Q 140 74 138 62 
                 Q 138 50 136 44 
                 Q 134 40 130 38 Z" 
              fill="url(#back-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Right Arm */}
            <path 
              d="M 172 38 
                 Q 176 44 176 54 
                 Q 178 66 176 78 
                 Q 174 86 168 88 
                 L 162 84 
                 Q 160 74 162 62 
                 Q 162 50 164 44 
                 Q 166 40 170 38 Z" 
              fill="url(#back-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Left Leg */}
            <path 
              d="M 134 78 
                 Q 130 90 130 106 
                 Q 130 122 134 138 
                 Q 136 152 140 164 
                 L 148 164 
                 Q 150 152 150 138 
                 Q 150 122 150 106 
                 Q 150 90 150 80 
                 Q 144 78 134 78 Z" 
              fill="url(#back-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
            
            {/* Right Leg */}
            <path 
              d="M 166 78 
                 Q 170 90 170 106 
                 Q 170 122 166 138 
                 Q 164 152 160 164 
                 L 152 164 
                 Q 150 152 150 138 
                 Q 150 122 150 106 
                 Q 150 90 150 80 
                 Q 156 78 166 78 Z" 
              fill="url(#back-body-gradient)" 
              stroke="#2a2a2e" 
              strokeWidth="0.5"
            />
          </g>
          
          {/* Muscle Groups */}
          <g>
            {renderMusclePaths(BACK_MUSCLES, 'back')}
          </g>
          
          {/* Label */}
          <text 
            x="150" 
            y="174" 
            textAnchor="middle" 
            className="text-[6px] uppercase tracking-[0.2em] font-medium"
            fill="#71717a"
          >
            Back
          </text>
        </svg>
      </div>
    </div>
  );
}
