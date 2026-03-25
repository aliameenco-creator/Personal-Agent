import React, { useCallback } from 'react';
import { useYouTubeWorkflow } from '../../hooks/useYouTubeWorkflow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { WorkflowStepper } from './WorkflowStepper';
import { TitleGenerator } from './TitleGenerator';
import { DescriptionEditor } from './DescriptionEditor';
import { TagGenerator } from './TagGenerator';
import { ThumbnailGenerator } from './ThumbnailGenerator';
import { VideoHookGenerator } from './VideoHookGenerator';
import { OutputPanel } from './OutputPanel';
import { KeyPhrase } from '../../types/youtube';
import { getProvider } from '../../services/ai/providerFactory';
import { generateDescription } from '../../services/youtube/descriptionService';
import { generateTags } from '../../services/youtube/tagService';
import { generateThumbnail } from '../../services/youtube/thumbnailService';
import { processSRT } from '../../services/youtube/srtParser';
import { generateScenePrompt, generateVideoClip, downloadVideoClip } from '../../services/youtube/videoHookService';

export const YouTubePage: React.FC = () => {
  const { state, dispatch, generateTitles, goToStep, reset } = useYouTubeWorkflow();
  const speech = useSpeechToText();

  const { project, loading, errors } = state;

  // --- Speech-to-text integration ---
  const handleSpeechResult = useCallback(() => {
    if (speech.transcript) {
      dispatch({ type: 'SET_TOPIC', payload: project.videoTopic + (project.videoTopic ? ' ' : '') + speech.transcript });
      speech.resetTranscript();
    }
  }, [speech.transcript, project.videoTopic, dispatch, speech.resetTranscript]);

  // Auto-append speech transcript
  React.useEffect(() => {
    handleSpeechResult();
  }, [speech.transcript]);

  // --- Description generation ---
  const handleGenerateDescription = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { step: 'description', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'description', error: null } });

    try {
      const provider = getProvider('gemini');
      const result = await generateDescription({
        title: project.selectedTitle,
        topic: project.videoTopic,
        keyPhrases: project.keyPhrases,
        provider,
      });
      dispatch({ type: 'SET_DESCRIPTION', payload: result.description });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'description', error: err.message || 'Failed to generate description' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'description', loading: false } });
    }
  }, [project.selectedTitle, project.videoTopic, project.keyPhrases, dispatch]);

  // --- Tag generation ---
  const handleGenerateTags = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { step: 'tags', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'tags', error: null } });

    try {
      const provider = getProvider('gemini');
      const result = await generateTags(
        {
          title: project.selectedTitle,
          description: project.editedDescription,
          topic: project.videoTopic,
        },
        provider
      );
      dispatch({ type: 'SET_TAGS', payload: result.tags });
      dispatch({ type: 'SET_FINAL_TAGS', payload: result.tags });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'tags', error: err.message || 'Failed to generate tags' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'tags', loading: false } });
    }
  }, [project.selectedTitle, project.editedDescription, project.videoTopic, dispatch]);

  // --- Thumbnail generation ---
  const handleGenerateThumbnail = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { step: 'thumbnail', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'thumbnail', error: null } });

    try {
      const thumbnailUrl = await generateThumbnail({
        title: project.selectedTitle || 'Untitled',
        thumbnailIdea: project.thumbnailPrompt || project.thumbnailIdea,
      });
      dispatch({ type: 'SET_THUMBNAILS', payload: [...project.generatedThumbnails, thumbnailUrl] });
      dispatch({ type: 'SELECT_THUMBNAIL', payload: thumbnailUrl });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'thumbnail', error: err.message || 'Failed to generate thumbnail' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'thumbnail', loading: false } });
    }
  }, [project.selectedTitle, project.thumbnailPrompt, project.thumbnailIdea, project.generatedThumbnails, dispatch]);

  // --- SRT parsing ---
  const handleParseSrt = useCallback(() => {
    try {
      const scenes = processSRT(project.srtText);
      dispatch({ type: 'SET_PARSED_SCENES', payload: scenes });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'hook', error: 'Failed to parse SRT: ' + err.message } });
    }
  }, [project.srtText, dispatch]);

  // --- Video hook generation ---
  const handleGenerateHooks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { step: 'hook', loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { step: 'hook', error: null } });

    const scenes = project.parsedScenes;
    const context = project.selectedTitle || project.videoTopic || 'YouTube video intro';

    try {
      // Generate prompts and videos for each scene
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        // Step 1: Generate visual prompt
        dispatch({ type: 'UPDATE_SCENE', payload: { id: scene.id, updates: { status: 'generating-prompt' } } });

        const prompt = await generateScenePrompt(
          scene.text,
          context,
          {
            prev: i > 0 ? scenes[i - 1].text : undefined,
            next: i < scenes.length - 1 ? scenes[i + 1].text : undefined,
          }
        );
        dispatch({ type: 'UPDATE_SCENE', payload: { id: scene.id, updates: { prompt, status: 'generating-video' } } });

        // Step 2: Generate video clip
        try {
          const duration = scene.end - scene.start;
          const videoUrl = await generateVideoClip(
            prompt,
            duration,
            project.veoModel,
            (status) => {
              dispatch({ type: 'UPDATE_SCENE', payload: { id: scene.id, updates: { status: 'polling' } } });
            }
          );
          dispatch({ type: 'UPDATE_SCENE', payload: { id: scene.id, updates: { videoUrl, status: 'completed' } } });
        } catch (err: any) {
          dispatch({
            type: 'UPDATE_SCENE',
            payload: { id: scene.id, updates: { status: 'error', errorMessage: err.message || 'Video generation failed' } },
          });
        }
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: { step: 'hook', error: err.message || 'Failed to generate video hooks' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { step: 'hook', loading: false } });
    }
  }, [project.parsedScenes, project.selectedTitle, project.videoTopic, project.veoModel, dispatch]);

  // --- Download scene ---
  const handleDownloadScene = useCallback(async (scene: any) => {
    if (!scene.videoUrl) return;
    try {
      await downloadVideoClip(scene.videoUrl, `hook-scene-${scene.index + 1}.mp4`);
    } catch {
      window.open(scene.videoUrl, '_blank');
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Stepper */}
      <WorkflowStepper currentStep={project.currentStep} onStepClick={goToStep} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto pb-32">
          {project.currentStep === 'title' && (
            <TitleGenerator
              videoTopic={project.videoTopic}
              generatedTitles={project.generatedTitles}
              selectedTitle={project.selectedTitle}
              thumbnailIdea={project.thumbnailIdea}
              isLoading={loading.title}
              error={errors.title}
              onTopicChange={topic => dispatch({ type: 'SET_TOPIC', payload: topic })}
              onGenerate={generateTitles}
              onSelectTitle={title => dispatch({ type: 'SELECT_TITLE', payload: title })}
              onNext={() => goToStep('description')}
              isListening={speech.isListening}
              isSpeechSupported={speech.isSupported}
              onStartListening={() => speech.startListening()}
              onStopListening={speech.stopListening}
              interimText={speech.interimText}
            />
          )}

          {project.currentStep === 'description' && (
            <DescriptionEditor
              title={project.selectedTitle}
              topic={project.videoTopic}
              keyPhrases={project.keyPhrases}
              generatedDescription={project.generatedDescription}
              editedDescription={project.editedDescription}
              isLoading={loading.description}
              error={errors.description}
              onAddPhrases={(phrases: KeyPhrase[]) => dispatch({ type: 'ADD_KEY_PHRASES', payload: phrases })}
              onRemovePhrase={(id: string) => dispatch({ type: 'REMOVE_KEY_PHRASE', payload: id })}
              onGenerate={handleGenerateDescription}
              onEditDescription={(text: string) => dispatch({ type: 'EDIT_DESCRIPTION', payload: text })}
              onNext={() => goToStep('tags')}
              onBack={() => goToStep('title')}
            />
          )}

          {project.currentStep === 'tags' && (
            <TagGenerator
              generatedTags={project.generatedTags}
              customTags={project.customTags}
              finalTags={project.finalTags}
              isLoading={loading.tags}
              error={errors.tags}
              onGenerate={handleGenerateTags}
              onAddCustomTag={(tag: string) => dispatch({ type: 'ADD_CUSTOM_TAG', payload: tag })}
              onRemoveTag={(tag: string) => dispatch({ type: 'REMOVE_TAG', payload: tag })}
              onBack={() => goToStep('description')}
            />
          )}

          {project.currentStep === 'thumbnail' && (
            <ThumbnailGenerator
              thumbnailPrompt={project.thumbnailPrompt}
              thumbnailIdea={project.thumbnailIdea}
              title={project.selectedTitle}
              generatedThumbnails={project.generatedThumbnails}
              selectedThumbnail={project.selectedThumbnail}
              isLoading={loading.thumbnail}
              error={errors.thumbnail}
              onPromptChange={(prompt: string) => dispatch({ type: 'SET_THUMBNAIL_PROMPT', payload: prompt })}
              onGenerate={handleGenerateThumbnail}
              onSelectThumbnail={(url: string) => dispatch({ type: 'SELECT_THUMBNAIL', payload: url })}
              onBack={() => goToStep('tags')}
            />
          )}

          {project.currentStep === 'hook' && (
            <VideoHookGenerator
              srtText={project.srtText}
              parsedScenes={project.parsedScenes}
              veoModel={project.veoModel}
              isLoading={loading.hook}
              error={errors.hook}
              onSrtChange={(text: string) => dispatch({ type: 'SET_SRT_TEXT', payload: text })}
              onParseSrt={handleParseSrt}
              onGenerate={handleGenerateHooks}
              onModelChange={(model: 'standard' | 'fast') => dispatch({ type: 'SET_VEO_MODEL', payload: model })}
              onDownloadScene={handleDownloadScene}
              onBack={() => goToStep('thumbnail')}
            />
          )}
        </div>
      </main>

      {/* Output Panel */}
      <OutputPanel
        title={project.selectedTitle}
        description={project.editedDescription}
        tags={[...new Set([...project.generatedTags, ...project.customTags])]}
        thumbnail={project.selectedThumbnail}
      />
    </div>
  );
};
