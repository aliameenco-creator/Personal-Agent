import React, { useState, useRef, useCallback } from 'react';
import { UploadedImage } from '../../types/thumbnail';
import { ThumbnailImageUpload } from './ThumbnailImageUpload';
import { ThumbnailAudioRecorder } from './ThumbnailAudioRecorder';
import { ImageModal } from '../ImageModal';
import { Button } from '../Button';
import { AssetGallery } from '../shared/AssetGallery';
import { GalleryAsset } from '../../services/assetGalleryService';
import { generateThumbnailFromPrompt, editThumbnail } from '../../services/thumbnail/thumbnailGenService';
import { Sparkles, Download, Image, Paintbrush, Pencil, Send, AlertCircle, Menu, Upload, X, ArrowRight, Paperclip, FolderOpen } from 'lucide-react';
import saveAs from 'file-saver';

interface ThumbnailPageProps {
  onToggleSidebar: () => void;
}

type Mode = 'generate' | 'edit-existing';

export const ThumbnailPage: React.FC<ThumbnailPageProps> = ({ onToggleSidebar }) => {
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState('');
  const [userImage, setUserImage] = useState<UploadedImage[]>([]);
  const [refImages, setRefImages] = useState<UploadedImage[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Attachments for inline edit (generate mode)
  const [editAttachments, setEditAttachments] = useState<{ file: File; previewUrl: string }[]>([]);
  const editAttachRef = useRef<HTMLInputElement>(null);

  // Edit existing thumbnail state
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingEditPrompt, setExistingEditPrompt] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const existingFileRef = useRef<HTMLInputElement>(null);

  // Attachments for edit-existing mode
  const [existingAttachments, setExistingAttachments] = useState<{ file: File; previewUrl: string }[]>([]);
  const existingAttachRef = useRef<HTMLInputElement>(null);

  // Asset gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'subject' | 'reference' | 'edit-attach' | 'existing-attach' | 'existing-thumbnail'>('subject');

  const openGallery = (target: typeof galleryTarget) => {
    setGalleryTarget(target);
    setGalleryOpen(true);
  };

  const dataUrlToFile = (dataUrl: string, name: string): File => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  };

  const handleGallerySelect = (assets: GalleryAsset[]) => {
    if (galleryTarget === 'subject') {
      const file = dataUrlToFile(assets[0].dataUrl, assets[0].name);
      const img: UploadedImage = { file, previewUrl: assets[0].dataUrl, id: assets[0].id };
      setUserImage([img]);
    } else if (galleryTarget === 'reference') {
      const newImgs: UploadedImage[] = assets.map(a => ({
        file: dataUrlToFile(a.dataUrl, a.name),
        previewUrl: a.dataUrl,
        id: a.id,
      }));
      setRefImages(prev => [...prev, ...newImgs].slice(0, 3));
    } else if (galleryTarget === 'edit-attach') {
      const newAtts = assets.map(a => ({
        file: dataUrlToFile(a.dataUrl, a.name),
        previewUrl: a.dataUrl,
      }));
      setEditAttachments(prev => [...prev, ...newAtts].slice(0, 3));
    } else if (galleryTarget === 'existing-attach') {
      const newAtts = assets.map(a => ({
        file: dataUrlToFile(a.dataUrl, a.name),
        previewUrl: a.dataUrl,
      }));
      setExistingAttachments(prev => [...prev, ...newAtts].slice(0, 3));
    } else if (galleryTarget === 'existing-thumbnail') {
      setExistingThumbnail(assets[0].dataUrl);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !generatedImage) return;
    setIsEditing(true);
    setError(null);
    try {
      const edited = await editThumbnail(generatedImage, editPrompt.trim(), editAttachments.map(a => a.file));
      setGeneratedImage(edited);
      setEditPrompt('');
      setEditAttachments([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to edit thumbnail.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please describe your thumbnail first.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const resultUrl = await generateThumbnailFromPrompt(
        prompt,
        userImage[0] || null,
        refImages
      );
      setGeneratedImage(resultUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranscription = (text: string) => {
    setPrompt(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleDownload = () => {
    if (generatedImage) {
      saveAs(generatedImage, 'youtube-thumbnail.png');
    }
  };

  // --- Edit existing thumbnail handlers ---
  const loadExistingFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setExistingThumbnail(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleExistingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      loadExistingFile(e.target.files[0]);
    }
    if (existingFileRef.current) existingFileRef.current.value = '';
  };

  const handleExistingDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExisting(true);
  }, []);

  const handleExistingDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExisting(false);
  }, []);

  const handleExistingDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExisting(false);
    if (e.dataTransfer.files?.[0]) {
      loadExistingFile(e.dataTransfer.files[0]);
    }
  }, [loadExistingFile]);

  const handleEditExisting = async () => {
    if (!existingEditPrompt.trim() || !existingThumbnail) return;
    setIsEditingExisting(true);
    setError(null);
    try {
      const edited = await editThumbnail(existingThumbnail, existingEditPrompt.trim(), existingAttachments.map(a => a.file));
      setExistingThumbnail(edited);
      setGeneratedImage(edited);
      setExistingEditPrompt('');
      setExistingAttachments([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to edit thumbnail.');
    } finally {
      setIsEditingExisting(false);
    }
  };

  const addAttachment = (files: FileList | null, target: 'edit' | 'existing') => {
    if (!files) return;
    const newAttachments = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    if (target === 'edit') {
      setEditAttachments(prev => [...prev, ...newAttachments].slice(0, 3));
    } else {
      setExistingAttachments(prev => [...prev, ...newAttachments].slice(0, 3));
    }
  };

  const removeAttachment = (index: number, target: 'edit' | 'existing') => {
    if (target === 'edit') {
      setEditAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setExistingAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-b border-brand-surface-container bg-brand-surface-container-highest/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-primary transition-colors">
            <Menu size={20} />
          </button>
          <h2 className="text-sm sm:text-base font-bold text-brand-on-surface">YouTube Thumbnail Generator</h2>
        </div>
        <span className="text-[10px] bg-brand-surface-container text-brand-on-surface-variant px-2 py-0.5 rounded-full font-bold">16:9 • 1280x720</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">

          {/* Mode Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('generate')}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                mode === 'generate'
                  ? 'bg-gradient-to-br from-brand-primary to-brand-primary-container text-white shadow-[0_4px_20px_rgba(255,73,0,0.25)]'
                  : 'bg-brand-surface-container-high text-brand-on-surface-variant hover:text-brand-on-surface'
              }`}
            >
              <Sparkles size={16} /> Create New
            </button>
            <button
              onClick={() => setMode('edit-existing')}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                mode === 'edit-existing'
                  ? 'bg-gradient-to-br from-brand-primary to-brand-primary-container text-white shadow-[0_4px_20px_rgba(255,73,0,0.25)]'
                  : 'bg-brand-surface-container-high text-brand-on-surface-variant hover:text-brand-on-surface'
              }`}
            >
              <Pencil size={16} /> Edit Existing
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 space-y-5">

              {mode === 'generate' ? (
                <>
                  {/* Visual Inputs */}
                  <div className="card-bright p-5 rounded-2xl space-y-5">
                    <h3 className="text-sm font-bold text-brand-on-surface flex items-center gap-2">
                      <div className="p-1.5 bg-brand-surface-container rounded-lg">
                        <Image size={16} className="text-brand-primary" />
                      </div>
                      Visual Inputs
                    </h3>

                    <div>
                      <ThumbnailImageUpload
                        label="1. Subject Image (You)"
                        images={userImage}
                        onChange={setUserImage}
                        multiple={false}
                      />
                      {userImage.length === 0 && (
                        <button
                          onClick={() => openGallery('subject')}
                          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary transition-colors"
                        >
                          <FolderOpen size={13} /> Choose from Gallery
                        </button>
                      )}
                    </div>

                    <div className="w-full h-px bg-brand-surface-container"></div>

                    <div>
                      <ThumbnailImageUpload
                        label="2. Style References (Optional)"
                        images={refImages}
                        onChange={setRefImages}
                        multiple={true}
                        maxImages={3}
                      />
                      {refImages.length < 3 && (
                        <button
                          onClick={() => openGallery('reference')}
                          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary transition-colors"
                        >
                          <FolderOpen size={13} /> Choose from Gallery
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="card-bright p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-brand-on-surface flex items-center gap-2">
                      <div className="p-1.5 bg-brand-surface-container rounded-lg">
                        <Paintbrush size={16} className="text-brand-primary" />
                      </div>
                      Prompt
                    </h3>

                    <div className="relative">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your thumbnail. E.g., 'Shocking reaction to new tech gadget, high contrast, bold text saying REVIEW'..."
                        rows={4}
                        className="w-full px-4 py-3 text-sm rounded-xl focus:ring-2 focus:ring-brand-primary bg-brand-surface-container-low text-brand-on-surface placeholder:text-brand-on-surface-variant/50 font-medium transition-all resize-none pr-14 border-none outline-none"
                      />
                      <div className="absolute bottom-3 right-3">
                        <ThumbnailAudioRecorder
                          onTranscription={handleTranscription}
                          isProcessing={isGenerating}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-brand-on-surface-variant">
                      Tip: Be specific about the text you want on the thumbnail. Use the mic to dictate.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-900/30 rounded-xl text-sm text-rose-400">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    isLoading={isGenerating}
                    className="w-full h-12 text-sm"
                  >
                    <Sparkles size={16} className="mr-2" /> Generate Thumbnail
                  </Button>
                </>
              ) : (
                <>
                  {/* Edit Existing Thumbnail Mode */}
                  <div className="card-bright p-5 rounded-2xl space-y-5">
                    <h3 className="text-sm font-bold text-brand-on-surface flex items-center gap-2">
                      <div className="p-1.5 bg-brand-surface-container rounded-lg">
                        <Upload size={16} className="text-brand-primary" />
                      </div>
                      Upload Your Thumbnail
                    </h3>

                    {existingThumbnail ? (
                      <div className="relative group">
                        <img
                          src={existingThumbnail}
                          alt="Existing thumbnail"
                          className="w-full rounded-xl aspect-video object-cover"
                        />
                        <button
                          onClick={() => setExistingThumbnail(null)}
                          className="absolute top-2 right-2 p-1.5 bg-brand-surface-dim/80 text-brand-on-surface rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-primary hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => existingFileRef.current?.click()}
                        onDragOver={handleExistingDragOver}
                        onDragLeave={handleExistingDragLeave}
                        onDrop={handleExistingDrop}
                        className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isDraggingExisting
                            ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface-container-highest'
                            : 'border-brand-outline-variant hover:border-brand-primary hover:bg-brand-surface-container-high'
                        }`}
                      >
                        <Upload size={32} className="text-brand-primary mb-3" />
                        <p className="text-sm font-semibold text-brand-on-surface">
                          {isDraggingExisting ? 'Drop your thumbnail here' : 'Drag & drop your thumbnail'}
                        </p>
                        <p className="text-xs text-brand-on-surface-variant mt-1">or click to browse</p>
                      </div>
                    )}

                    {!existingThumbnail && (
                      <button
                        onClick={() => openGallery('existing-thumbnail')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary transition-colors"
                      >
                        <FolderOpen size={13} /> Choose from Gallery
                      </button>
                    )}

                    <input
                      type="file"
                      ref={existingFileRef}
                      onChange={handleExistingFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  {/* Edit Instructions */}
                  <div className="card-bright p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-brand-on-surface flex items-center gap-2">
                      <div className="p-1.5 bg-brand-surface-container rounded-lg">
                        <Pencil size={16} className="text-brand-primary" />
                      </div>
                      What changes do you want?
                    </h3>

                    <textarea
                      value={existingEditPrompt}
                      onChange={(e) => setExistingEditPrompt(e.target.value)}
                      placeholder="Describe the changes you want. E.g., 'Add this logo to the top-left', 'Replace the background with the attached image', 'Make the text bigger and bolder'..."
                      rows={4}
                      className="w-full px-4 py-3 text-sm rounded-xl focus:ring-2 focus:ring-brand-primary bg-brand-surface-container-low text-brand-on-surface placeholder:text-brand-on-surface-variant/50 font-medium transition-all resize-none border-none outline-none"
                    />

                    {/* Attachments */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {existingAttachments.map((att, i) => (
                        <div key={i} className="relative group w-12 h-12 rounded-lg overflow-hidden bg-brand-surface-container-high">
                          <img src={att.previewUrl} alt="Attachment" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeAttachment(i, 'existing')}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                      {existingAttachments.length < 3 && (
                        <>
                          <button
                            onClick={() => existingAttachRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary bg-brand-surface-container-low rounded-lg hover:bg-brand-surface-container-high transition-all"
                          >
                            <Paperclip size={14} /> Attach
                          </button>
                          <button
                            onClick={() => openGallery('existing-attach')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary bg-brand-surface-container-low rounded-lg hover:bg-brand-surface-container-high transition-all"
                          >
                            <FolderOpen size={14} /> Gallery
                          </button>
                        </>
                      )}
                      <input
                        type="file"
                        ref={existingAttachRef}
                        onChange={(e) => { addAttachment(e.target.files, 'existing'); e.target.value = ''; }}
                        className="hidden"
                        accept="image/*"
                        multiple
                      />
                    </div>
                    <p className="text-[10px] text-brand-on-surface-variant">
                      Attach images you want the AI to use (logos, backgrounds, etc.)
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-900/30 rounded-xl text-sm text-rose-400">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  {/* Edit Button */}
                  <Button
                    onClick={handleEditExisting}
                    disabled={isEditingExisting || !existingThumbnail || !existingEditPrompt.trim()}
                    isLoading={isEditingExisting}
                    className="w-full h-12 text-sm"
                  >
                    <Pencil size={16} className="mr-2" /> Apply Changes
                  </Button>
                </>
              )}
            </div>

            {/* Right Column: Output */}
            <div className="lg:col-span-7">
              <div className="card-bright rounded-2xl overflow-hidden h-full min-h-[400px] lg:min-h-[500px] flex flex-col">
                <div className="px-5 py-3 border-b border-brand-surface-container bg-brand-surface-container-high">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-brand-on-surface">Result (1280x720)</h3>
                    {generatedImage && (
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-surface-container-highest rounded-lg hover:bg-brand-surface-container transition-colors"
                      >
                        <Download size={14} /> Download
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-brand-surface-container-low/30 flex items-center justify-center p-6 relative">
                  {generatedImage ? (
                    <div
                      className="relative shadow-2xl rounded-xl overflow-hidden ring-1 ring-brand-outline-variant cursor-pointer hover:ring-brand-primary transition-all"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <img
                        src={generatedImage}
                        alt="Generated Thumbnail"
                        className="w-full max-w-full h-auto aspect-video object-contain"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  ) : isGenerating || isEditingExisting ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-brand-primary text-sm font-semibold animate-pulse">
                        {isEditingExisting ? 'Applying changes...' : 'Generating your thumbnail...'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center max-w-sm">
                      <div className="w-20 h-20 bg-brand-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image size={32} className="text-brand-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-on-surface-variant mb-2">Ready to Create</h3>
                      <p className="text-sm text-brand-on-surface-variant">
                        {mode === 'generate'
                          ? 'Upload your reference images and describe your video to generate a custom 16:9 YouTube thumbnail.'
                          : 'Upload an existing thumbnail and describe the changes you want to make.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Edit Prompt - shown after generation in generate mode */}
                {generatedImage && mode === 'generate' && (
                  <div className="px-5 py-3 border-t border-brand-surface-container bg-brand-surface-container-high space-y-2">
                    {/* Attachment previews */}
                    {editAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editAttachments.map((att, i) => (
                          <div key={i} className="relative group w-10 h-10 rounded-lg overflow-hidden bg-brand-surface-container">
                            <img src={att.previewUrl} alt="Attachment" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeAttachment(i, 'edit')}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {editAttachments.length < 3 && (
                        <>
                          <button
                            onClick={() => editAttachRef.current?.click()}
                            className="p-1.5 rounded-md text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container transition-colors flex-shrink-0"
                            title="Attach an image"
                          >
                            <Paperclip size={14} />
                          </button>
                          <button
                            onClick={() => openGallery('edit-attach')}
                            className="p-1.5 rounded-md text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container transition-colors flex-shrink-0"
                            title="Choose from gallery"
                          >
                            <FolderOpen size={14} />
                          </button>
                        </>
                      )}
                      <input
                        type="file"
                        ref={editAttachRef}
                        onChange={(e) => { addAttachment(e.target.files, 'edit'); e.target.value = ''; }}
                        className="hidden"
                        accept="image/*"
                        multiple
                      />
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !isEditing) handleEdit(); }}
                          placeholder="Refine this thumbnail... attach images + describe changes"
                          disabled={isEditing}
                          className="w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-brand-primary bg-brand-surface-container-low text-brand-on-surface placeholder:text-brand-on-surface-variant/50 font-medium pr-10 disabled:opacity-50 border-none outline-none"
                        />
                        <button
                          onClick={handleEdit}
                          disabled={isEditing || !editPrompt.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-brand-primary hover:bg-brand-surface-container disabled:opacity-30 transition-colors"
                        >
                          {isEditing ? (
                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      <ImageModal
        isOpen={previewOpen}
        imageUrl={generatedImage}
        onClose={() => setPreviewOpen(false)}
        onDownload={handleDownload}
        fileName="youtube-thumbnail.png"
      />

      {/* Asset Gallery modal */}
      <AssetGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleGallerySelect}
        multiple={galleryTarget === 'reference' || galleryTarget === 'edit-attach' || galleryTarget === 'existing-attach'}
        maxSelect={3}
      />
    </div>
  );
};
