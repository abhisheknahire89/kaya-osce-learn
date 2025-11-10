import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const AYURVEDIC_FACTS = [
  "आयुर्वेद - The science of life dates back over 5,000 years",
  "त्रिदोष - Vata, Pitta, and Kapha govern all physiological functions",
  "अग्नि - Digestive fire is the cornerstone of health in Ayurveda",
  "प्रकृति - Each person has a unique constitutional type",
  "पञ्चकर्म - The five purification therapies cleanse deep-seated toxins",
  "नाडी परीक्षा - Pulse diagnosis reveals imbalances across doshas",
  "द्रव्यगुण - Herbal properties are classified by taste, potency, and post-digestive effect",
  "दिनचर्या - Daily routines aligned with nature promote longevity",
  "ऋतुचर्या - Seasonal regimens help maintain doshic balance",
  "रसायन - Rejuvenation therapies enhance immunity and vitality",
  "स्वस्थवृत्त - Preventive medicine is the highest form of treatment",
  "मर्म - Vital energy points connect consciousness and physiology",
];

interface LoadingWithFactsProps {
  message?: string;
}

export const LoadingWithFacts = ({ message = "Generating case with Veda AI..." }: LoadingWithFactsProps) => {
  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % AYURVEDIC_FACTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            This may take up to 30 seconds...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-[#7AA86E] animate-[loading_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Rotating Facts */}
        <div className="bg-accent/20 rounded-2xl p-6 border border-primary/20 min-h-[120px] flex items-center justify-center">
          <div
            key={currentFact}
            className="animate-[fadeIn_0.5s_ease-in-out] space-y-2"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Did you know?
            </p>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {AYURVEDIC_FACTS[currentFact]}
            </p>
          </div>
        </div>

        {/* Sanskrit subtitle */}
        <p className="text-xs text-muted-foreground" lang="hi">
          कृपया प्रतीक्षा करें • Please wait
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
