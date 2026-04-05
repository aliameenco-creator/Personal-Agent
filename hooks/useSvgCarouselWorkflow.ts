import { useReducer, useCallback } from 'react';
import { SvgCarouselProject, SvgCarouselPhase, SvgSlide } from '../types/svgCarousel';
import { generateSvgSlide } from '../services/svgCarousel/svgGeneratorService';

// --- State ---

export interface SvgCarouselWorkflowState {
  project: SvgCarouselProject;
  loading: boolean;
  error: string | null;
}

const createInitialProject = (): SvgCarouselProject => ({
  id: Math.random().toString(36).substr(2, 9),
  topic: '',
  slideCount: 5,
  slides: [],
  currentPhase: 'setup',
});

const createInitialState = (): SvgCarouselWorkflowState => ({
  project: createInitialProject(),
  loading: false,
  error: null,
});

// --- Actions ---

type SvgCarouselAction =
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'SET_SLIDE_COUNT'; payload: number }
  | { type: 'SET_SLIDES'; payload: SvgSlide[] }
  | { type: 'UPDATE_SLIDE'; payload: { id: string; updates: Partial<SvgSlide> } }
  | { type: 'SET_PHASE'; payload: SvgCarouselPhase }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

function reducer(state: SvgCarouselWorkflowState, action: SvgCarouselAction): SvgCarouselWorkflowState {
  switch (action.type) {
    case 'SET_TOPIC':
      return { ...state, project: { ...state.project, topic: action.payload } };
    case 'SET_SLIDE_COUNT':
      return { ...state, project: { ...state.project, slideCount: action.payload } };
    case 'SET_SLIDES':
      return { ...state, project: { ...state.project, slides: action.payload } };
    case 'UPDATE_SLIDE':
      return {
        ...state,
        project: {
          ...state.project,
          slides: state.project.slides.map(s =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
        },
      };
    case 'SET_PHASE':
      return { ...state, project: { ...state.project, currentPhase: action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

// --- Hook ---

export function useSvgCarouselWorkflow() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const generateSlides = useCallback(async () => {
    const { topic, slideCount } = state.project;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_PHASE', payload: 'generation' });

    // Initialize all slides as pending
    const initial: SvgSlide[] = Array.from({ length: slideCount }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      index: i,
      svgCode: null,
      status: 'generating',
    }));
    dispatch({ type: 'SET_SLIDES', payload: initial });

    // Generate all slides in parallel
    const promises = initial.map(async (slide) => {
      try {
        const svgCode = await generateSvgSlide({
          topic,
          slideIndex: slide.index,
          totalSlides: slideCount,
        });
        dispatch({
          type: 'UPDATE_SLIDE',
          payload: { id: slide.id, updates: { svgCode, status: 'completed' } },
        });
      } catch (err: any) {
        dispatch({
          type: 'UPDATE_SLIDE',
          payload: {
            id: slide.id,
            updates: { status: 'error', errorMessage: err.message || 'Failed to generate SVG' },
          },
        });
      }
    });

    await Promise.allSettled(promises);
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [state.project]);

  const regenerateSlide = useCallback(async (slideId: string) => {
    const slide = state.project.slides.find(s => s.id === slideId);
    if (!slide) return;

    dispatch({
      type: 'UPDATE_SLIDE',
      payload: { id: slideId, updates: { status: 'generating', errorMessage: undefined } },
    });

    try {
      const svgCode = await generateSvgSlide({
        topic: state.project.topic,
        slideIndex: slide.index,
        totalSlides: state.project.slideCount,
      });
      dispatch({
        type: 'UPDATE_SLIDE',
        payload: { id: slideId, updates: { svgCode, status: 'completed' } },
      });
    } catch (err: any) {
      dispatch({
        type: 'UPDATE_SLIDE',
        payload: {
          id: slideId,
          updates: { status: 'error', errorMessage: err.message || 'Failed to regenerate SVG' },
        },
      });
    }
  }, [state.project]);

  const goToPhase = useCallback((phase: SvgCarouselPhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    dispatch,
    generateSlides,
    regenerateSlide,
    goToPhase,
    reset,
  };
}
