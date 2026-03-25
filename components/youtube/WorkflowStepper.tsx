import React from 'react';
import { WorkflowStep } from '../../types/youtube';
import { Type, FileText, Hash, ImageIcon, Film } from 'lucide-react';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  completedSteps?: Set<WorkflowStep>;
}

const steps: { key: WorkflowStep; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'title', label: 'Title', icon: Type },
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'tags', label: 'Tags', icon: Hash },
  { key: 'thumbnail', label: 'Thumbnail', icon: ImageIcon },
  { key: 'hook', label: 'Video Hook', icon: Film },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  onStepClick,
  completedSteps = new Set(),
}) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4">
      {steps.map((step, index) => {
        const isCurrent = currentStep === step.key;
        const isCompleted = completedSteps.has(step.key);
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <div
                className={`hidden sm:block w-8 lg:w-12 h-0.5 ${
                  isCompleted || isCurrent ? 'bg-gradient-to-r from-brand-primary to-brand-primary' : 'bg-brand-surface-container-high'
                }`}
              />
            )}
            <button
              onClick={() => onStepClick(step.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary text-white shadow-lg shadow-brand-outline-variant'
                  : isCompleted
                  ? 'bg-brand-surface-container text-brand-primary hover:bg-brand-outline-variant'
                  : 'text-brand-on-surface-variant hover:text-brand-on-surface-variant hover:bg-brand-surface-container'
              }`}
            >
              <Icon size={16} className={isCurrent ? 'text-white' : ''} />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
