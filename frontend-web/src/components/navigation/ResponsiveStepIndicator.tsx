import React from 'react';
import { Check, LucideIcon } from 'lucide-react';

interface Step {
  id: string;
  titulo: string;
  icone: LucideIcon;
}

interface ResponsiveStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

const ResponsiveStepIndicator: React.FC<ResponsiveStepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className = ''
}) => {
  const canNavigateToStep = (stepIndex: number) => {
    return stepIndex <= currentStep || completedSteps.includes(stepIndex);
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'available';
    return 'disabled';
  };

  const getStepClasses = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const baseClasses = 'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium transition-all duration-200';

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500 text-white shadow-md`;
      case 'current':
        return `${baseClasses} bg-[#159A9C] text-white shadow-lg ring-4 ring-teal-100`;
      case 'available':
        return `${baseClasses} bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-400`;
    }
  };

  const getConnectorClasses = (stepIndex: number) => {
    if (stepIndex >= steps.length - 1) return 'hidden';

    const isCompleted = completedSteps.includes(stepIndex) || stepIndex < currentStep;
    return `hidden sm:block flex-1 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-[#159A9C]' : 'bg-gray-200'
      }`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile: Compact horizontal indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4 px-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => canNavigateToStep(index) && onStepClick?.(index)}
                disabled={!canNavigateToStep(index)}
                className={getStepClasses(index)}
              >
                {completedSteps.includes(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icone className="w-4 h-4" />
                )}
              </button>
              <span className={`mt-1 text-xs text-center ${index === currentStep ? 'text-[#159A9C] font-medium' : 'text-gray-500'
                }`}>
                {step.titulo}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
          <div
            className="bg-[#159A9C] h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Current step info */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            {steps[currentStep]?.titulo}
          </p>
        </div>
      </div>

      {/* Desktop: Full horizontal stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => canNavigateToStep(index) && onStepClick?.(index)}
                  disabled={!canNavigateToStep(index)}
                  className={`${getStepClasses(index)} mb-1`}
                >
                  {completedSteps.includes(index) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icone className="w-4 h-4" />
                  )}
                </button>

                <div className="text-center max-w-20">
                  <p className={`text-xs font-medium ${index === currentStep ? 'text-[#159A9C]' : 'text-gray-700'
                    }`}>
                    {step.titulo}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              <div className={getConnectorClasses(index)} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveStepIndicator;
