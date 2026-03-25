import { useReducer, useCallback } from 'react';
import {
  LinkedInProject,
  LinkedInPhase,
  LinkedInPostType,
  LinkedInBrandKit,
  SlideContent,
  GeneratedSlide,
  ReferencePost,
} from '../types/linkedin';
import { generateSlideContent } from '../services/linkedin/contentService';
import { generateSlideImage, editSlideImage } from '../services/linkedin/slideGeneratorService';

// --- State ---

export interface LinkedInWorkflowState {
  project: LinkedInProject;
  brandKit: LinkedInBrandKit | null;
  loading: {
    content: boolean;
    generation: boolean;
  };
  errors: {
    content: string | null;
    generation: string | null;
  };
  generatingSlideIndex: number | null;
}

const createInitialProject = (): LinkedInProject => ({
  id: Math.random().toString(36).substr(2, 9),
  postType: 'carousel',
  topic: '',
  referencePost: { images: [], enabled: false },
  slideCount: 5,
  slideContents: [],
  generatedSlides: [],
  currentPhase: 'setup',
});

const createInitialState = (): LinkedInWorkflowState => ({
  project: createInitialProject(),
  brandKit: null,
  loading: { content: false, generation: false },
  errors: { content: null, generation: null },
  generatingSlideIndex: null,
});

// --- Actions ---

type LinkedInAction =
  | { type: 'SET_BRAND_KIT'; payload: LinkedInBrandKit | null }
  | { type: 'SET_POST_TYPE'; payload: LinkedInPostType }
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'SET_SLIDE_COUNT'; payload: number }
  | { type: 'SET_REFERENCE_POST'; payload: ReferencePost }
  | { type: 'SET_SLIDE_CONTENTS'; payload: SlideContent[] }
  | { type: 'UPDATE_SLIDE_CONTENT'; payload: { id: string; updates: Partial<SlideContent> } }
  | { type: 'REORDER_SLIDES'; payload: SlideContent[] }
  | { type: 'SET_GENERATED_SLIDES'; payload: GeneratedSlide[] }
  | { type: 'UPDATE_GENERATED_SLIDE'; payload: { id: string; updates: Partial<GeneratedSlide> } }
  | { type: 'SET_PHASE'; payload: LinkedInPhase }
  | { type: 'SET_LOADING'; payload: { step: 'content' | 'generation'; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { step: 'content' | 'generation'; error: string | null } }
  | { type: 'SET_GENERATING_INDEX'; payload: number | null }
  | { type: 'RESET' };

function workflowReducer(state: LinkedInWorkflowState, action: LinkedInAction): LinkedInWorkflowState {
  switch (action.type) {
    case 'SET_BRAND_KIT':
      return { ...state, brandKit: action.payload };
    case 'SET_POST_TYPE':
      return {
        ...state,
        project: {
          ...state.project,
          postType: action.payload,
          slideCount: action.payload === 'single' ? 1 : state.project.slideCount < 2 ? 5 : state.project.slideCount,
        },
      };
    case 'SET_TOPIC':
      return { ...state, project: { ...state.project, topic: action.payload } };
    case 'SET_SLIDE_COUNT':
      return { ...state, project: { ...state.project, slideCount: action.payload } };
    case 'SET_REFERENCE_POST':
      return { ...state, project: { ...state.project, referencePost: action.payload } };
    case 'SET_SLIDE_CONTENTS':
      return { ...state, project: { ...state.project, slideContents: action.payload } };
    case 'UPDATE_SLIDE_CONTENT':
      return {
        ...state,
        project: {
          ...state.project,
          slideContents: state.project.slideContents.map(s =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
        },
      };
    case 'REORDER_SLIDES':
      return {
        ...state,
        project: {
          ...state.project,
          slideContents: action.payload.map((s, i) => ({ ...s, index: i })),
        },
      };
    case 'SET_GENERATED_SLIDES':
      return { ...state, project: { ...state.project, generatedSlides: action.payload } };
    case 'UPDATE_GENERATED_SLIDE':
      return {
        ...state,
        project: {
          ...state.project,
          generatedSlides: state.project.generatedSlides.map(s =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
        },
      };
    case 'SET_PHASE':
      return { ...state, project: { ...state.project, currentPhase: action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.step]: action.payload.loading } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload.step]: action.payload.error } };
    case 'SET_GENERATING_INDEX':
      return { ...state, generatingSlideIndex: action.payload };
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

// --- Hook ---

export function useLinkedInWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, undefined, createInitialState);

  const generateContent = useCallback(async (brandKit: LinkedInBrandKit) => {
    const { topic, postType, slideCount, referencePost } = state.project;

    dispatch({ type: 'SET_LOADING', payload: { step: 'content', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'content', error: null } });

    try {
      const slides = await generateSlideContent({
        topic,
        postType,
        slideCount,
        brandKit,
        referenceImages: referencePost.enabled ? referencePost.images : undefined,
      });
      dispatch({ type: 'SET_SLIDE_CONTENTS', payload: slides });
      dispatch({ type: 'SET_PHASE', payload: 'content' });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'content', error: err.message || 'Failed to generate content' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'content', loading: false } });
    }
  }, [state.project]);

  const generateVisuals = useCallback(async (brandKit: LinkedInBrandKit) => {
    const { slideContents, referencePost } = state.project;

    dispatch({ type: 'SET_LOADING', payload: { step: 'generation', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'generation', error: null } });
    dispatch({ type: 'SET_PHASE', payload: 'generation' });

    // Initialize generated slides
    const initial: GeneratedSlide[] = slideContents.map(sc => ({
      id: sc.id,
      index: sc.index,
      content: sc,
      imageDataUrl: null,
      status: 'generating',
    }));
    dispatch({ type: 'SET_GENERATED_SLIDES', payload: initial });

    const refImages = referencePost.enabled ? referencePost.images : undefined;

    // Generate all slides in parallel
    const promises = slideContents.map(async (slideContent, i) => {
      try {
        const imageDataUrl = await generateSlideImage({
          slideContent,
          brandKit,
          slideIndex: i,
          totalSlides: slideContents.length,
          referenceImages: refImages,
        });
        dispatch({
          type: 'UPDATE_GENERATED_SLIDE',
          payload: { id: slideContent.id, updates: { imageDataUrl, status: 'completed' } },
        });
      } catch (err: any) {
        dispatch({
          type: 'UPDATE_GENERATED_SLIDE',
          payload: {
            id: slideContent.id,
            updates: { status: 'error', errorMessage: err.message || 'Failed to generate slide' },
          },
        });
      }
    });

    await Promise.allSettled(promises);

    dispatch({ type: 'SET_GENERATING_INDEX', payload: null });
    dispatch({ type: 'SET_LOADING', payload: { step: 'generation', loading: false } });
  }, [state.project]);

  const regenerateSlide = useCallback(async (slideId: string, brandKit: LinkedInBrandKit) => {
    const { slideContents, generatedSlides, referencePost } = state.project;
    const slide = generatedSlides.find(s => s.id === slideId);
    const slideContent = slideContents.find(s => s.id === slideId);
    if (!slide || !slideContent) return;

    dispatch({
      type: 'UPDATE_GENERATED_SLIDE',
      payload: { id: slideId, updates: { status: 'generating', errorMessage: undefined } },
    });

    try {
      const imageDataUrl = await generateSlideImage({
        slideContent,
        brandKit,
        slideIndex: slideContent.index,
        totalSlides: slideContents.length,
        referenceImages: referencePost.enabled ? referencePost.images : undefined,
      });
      dispatch({
        type: 'UPDATE_GENERATED_SLIDE',
        payload: { id: slideId, updates: { imageDataUrl, status: 'completed' } },
      });
    } catch (err: any) {
      dispatch({
        type: 'UPDATE_GENERATED_SLIDE',
        payload: {
          id: slideId,
          updates: { status: 'error', errorMessage: err.message || 'Failed to regenerate slide' },
        },
      });
    }
  }, [state.project]);

  const editSlide = useCallback(async (slideId: string, userMessage: string) => {
    const slide = state.project.generatedSlides.find(s => s.id === slideId);
    if (!slide || !slide.imageDataUrl) return;

    dispatch({
      type: 'UPDATE_GENERATED_SLIDE',
      payload: { id: slideId, updates: { status: 'generating', errorMessage: undefined } },
    });

    try {
      const imageDataUrl = await editSlideImage(slide.imageDataUrl, userMessage);
      dispatch({
        type: 'UPDATE_GENERATED_SLIDE',
        payload: { id: slideId, updates: { imageDataUrl, status: 'completed' } },
      });
    } catch (err: any) {
      dispatch({
        type: 'UPDATE_GENERATED_SLIDE',
        payload: {
          id: slideId,
          updates: { status: 'error', errorMessage: err.message || 'Failed to edit slide' },
        },
      });
    }
  }, [state.project.generatedSlides]);

  const goToPhase = useCallback((phase: LinkedInPhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    dispatch,
    generateContent,
    generateVisuals,
    regenerateSlide,
    editSlide,
    goToPhase,
    reset,
  };
}
