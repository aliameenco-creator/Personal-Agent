import { useReducer, useCallback } from 'react';
import { YouTubeProject, WorkflowStep, KeyPhrase, SRTScene } from '../types/youtube';
import { getProvider } from '../services/ai/providerFactory';

// --- State ---

export interface WorkflowState {
  project: YouTubeProject;
  loading: Record<WorkflowStep, boolean>;
  errors: Record<WorkflowStep, string | null>;
}

const createInitialProject = (profileId: string): YouTubeProject => ({
  id: Math.random().toString(36).substr(2, 9),
  profileId,
  status: 'draft',
  videoTopic: '',
  generatedTitles: [],
  selectedTitle: '',
  thumbnailIdea: '',
  keyPhrases: [],
  generatedDescription: '',
  editedDescription: '',
  generatedTags: [],
  customTags: [],
  finalTags: [],
  thumbnailPrompt: '',
  generatedThumbnails: [],
  selectedThumbnail: null,
  srtText: '',
  parsedScenes: [],
  veoModel: 'fast',
  currentStep: 'title',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const initialLoading: Record<WorkflowStep, boolean> = {
  title: false,
  description: false,
  tags: false,
  thumbnail: false,
  hook: false,
};

const initialErrors: Record<WorkflowStep, string | null> = {
  title: null,
  description: null,
  tags: null,
  thumbnail: null,
  hook: null,
};

const createInitialState = (profileId: string): WorkflowState => ({
  project: createInitialProject(profileId),
  loading: { ...initialLoading },
  errors: { ...initialErrors },
});

// --- Actions ---

type WorkflowAction =
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'SET_TITLES'; payload: string[] }
  | { type: 'SELECT_TITLE'; payload: string }
  | { type: 'SET_THUMBNAIL_IDEA'; payload: string }
  | { type: 'ADD_KEY_PHRASES'; payload: KeyPhrase[] }
  | { type: 'REMOVE_KEY_PHRASE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'EDIT_DESCRIPTION'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'ADD_CUSTOM_TAG'; payload: string }
  | { type: 'REMOVE_TAG'; payload: string }
  | { type: 'SET_FINAL_TAGS'; payload: string[] }
  | { type: 'SET_THUMBNAIL_PROMPT'; payload: string }
  | { type: 'SET_THUMBNAILS'; payload: string[] }
  | { type: 'SELECT_THUMBNAIL'; payload: string }
  | { type: 'SET_SRT_TEXT'; payload: string }
  | { type: 'SET_PARSED_SCENES'; payload: SRTScene[] }
  | { type: 'UPDATE_SCENE'; payload: { id: string; updates: Partial<SRTScene> } }
  | { type: 'SET_VEO_MODEL'; payload: 'standard' | 'fast' }
  | { type: 'GO_TO_STEP'; payload: WorkflowStep }
  | { type: 'SET_LOADING'; payload: { step: WorkflowStep; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { step: WorkflowStep; error: string | null } }
  | { type: 'RESET'; payload: string };

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_TOPIC':
      return { ...state, project: { ...state.project, videoTopic: action.payload, updatedAt: Date.now() } };
    case 'SET_TITLES':
      return { ...state, project: { ...state.project, generatedTitles: action.payload, updatedAt: Date.now() } };
    case 'SELECT_TITLE':
      return { ...state, project: { ...state.project, selectedTitle: action.payload, updatedAt: Date.now() } };
    case 'SET_THUMBNAIL_IDEA':
      return { ...state, project: { ...state.project, thumbnailIdea: action.payload, updatedAt: Date.now() } };
    case 'ADD_KEY_PHRASES':
      return {
        ...state,
        project: {
          ...state.project,
          keyPhrases: [...state.project.keyPhrases, ...action.payload],
          updatedAt: Date.now(),
        },
      };
    case 'REMOVE_KEY_PHRASE':
      return {
        ...state,
        project: {
          ...state.project,
          keyPhrases: state.project.keyPhrases.filter(kp => kp.id !== action.payload),
          updatedAt: Date.now(),
        },
      };
    case 'SET_DESCRIPTION':
      return {
        ...state,
        project: {
          ...state.project,
          generatedDescription: action.payload,
          editedDescription: action.payload,
          updatedAt: Date.now(),
        },
      };
    case 'EDIT_DESCRIPTION':
      return { ...state, project: { ...state.project, editedDescription: action.payload, updatedAt: Date.now() } };
    case 'SET_TAGS':
      return { ...state, project: { ...state.project, generatedTags: action.payload, updatedAt: Date.now() } };
    case 'ADD_CUSTOM_TAG':
      return {
        ...state,
        project: {
          ...state.project,
          customTags: [...state.project.customTags, action.payload],
          updatedAt: Date.now(),
        },
      };
    case 'REMOVE_TAG':
      return {
        ...state,
        project: {
          ...state.project,
          generatedTags: state.project.generatedTags.filter(t => t !== action.payload),
          customTags: state.project.customTags.filter(t => t !== action.payload),
          finalTags: state.project.finalTags.filter(t => t !== action.payload),
          updatedAt: Date.now(),
        },
      };
    case 'SET_FINAL_TAGS':
      return { ...state, project: { ...state.project, finalTags: action.payload, updatedAt: Date.now() } };
    case 'SET_THUMBNAIL_PROMPT':
      return { ...state, project: { ...state.project, thumbnailPrompt: action.payload, updatedAt: Date.now() } };
    case 'SET_THUMBNAILS':
      return { ...state, project: { ...state.project, generatedThumbnails: action.payload, updatedAt: Date.now() } };
    case 'SELECT_THUMBNAIL':
      return { ...state, project: { ...state.project, selectedThumbnail: action.payload, updatedAt: Date.now() } };
    case 'SET_SRT_TEXT':
      return { ...state, project: { ...state.project, srtText: action.payload, updatedAt: Date.now() } };
    case 'SET_PARSED_SCENES':
      return { ...state, project: { ...state.project, parsedScenes: action.payload, updatedAt: Date.now() } };
    case 'UPDATE_SCENE':
      return {
        ...state,
        project: {
          ...state.project,
          parsedScenes: state.project.parsedScenes.map(s =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
          updatedAt: Date.now(),
        },
      };
    case 'SET_VEO_MODEL':
      return { ...state, project: { ...state.project, veoModel: action.payload, updatedAt: Date.now() } };
    case 'GO_TO_STEP':
      return { ...state, project: { ...state.project, currentStep: action.payload, updatedAt: Date.now() } };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.step]: action.payload.loading } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload.step]: action.payload.error } };
    case 'RESET':
      return createInitialState(action.payload);
    default:
      return state;
  }
}

// --- Hook ---

export function useYouTubeWorkflow(profileId: string = 'default') {
  const [state, dispatch] = useReducer(workflowReducer, profileId, createInitialState);

  const generateTitles = useCallback(async (topic: string) => {
    dispatch({ type: 'SET_LOADING', payload: { step: 'title', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'title', error: null } });

    try {
      const provider = getProvider('gemini');
      const response = await provider.generateText({
        systemPrompt: `You are a YouTube SEO expert. Generate exactly 5 compelling video title options for the given topic. Each title should be:
- Under 70 characters
- Click-worthy and curiosity-driven
- SEO optimized with relevant keywords
- Varied in style (how-to, listicle, question, bold claim, etc.)

Also generate a thumbnail concept idea — a short description of what the thumbnail should visually show.

Return your response in this exact JSON format:
{"titles": ["title1", "title2", "title3", "title4", "title5"], "thumbnailIdea": "description of thumbnail concept"}`,
        userPrompt: `Video topic: ${topic}`,
        temperature: 0.8,
      });

      let text = response.text.trim();
      // Strip markdown code block fencing if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        text = jsonMatch[1].trim();
      }
      const parsed = JSON.parse(text);
      dispatch({ type: 'SET_TITLES', payload: parsed.titles });
      dispatch({ type: 'SET_THUMBNAIL_IDEA', payload: parsed.thumbnailIdea });
      if (parsed.titles.length > 0) {
        dispatch({ type: 'SELECT_TITLE', payload: parsed.titles[0] });
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'title', error: err.message || 'Failed to generate titles' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'title', loading: false } });
    }
  }, []);

  const goToStep = useCallback((step: WorkflowStep) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', payload: profileId });
  }, [profileId]);

  return {
    state,
    dispatch,
    generateTitles,
    goToStep,
    reset,
  };
}
