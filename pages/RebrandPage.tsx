import React, { useState } from 'react';
import { BrandSidebar } from '../components/BrandSidebar';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';
import { ImageModal } from '../components/ImageModal';
import { BrandAssets, RebrandJob } from '../types';
import { rebrandImage, editImage } from '../services/geminiService';
import { ChatPanel } from '../components/ChatPanel';
import { Send, RefreshCw, Download, Info, Trash2, CheckCircle, AlertCircle, Loader2, Images, ArrowRight, Maximize2, MessageSquare, Sparkles, Menu } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const MAX_IMAGES = 10;

interface RebrandPageProps {
  onToggleSidebar: () => void;
}

export const RebrandPage: React.FC<RebrandPageProps> = ({ onToggleSidebar }) => {
  const [brandAssets, setBrandAssets] = useState<BrandAssets>({
    whiteLogo: null,
    blackLogo: null,
    brandName: '',
  });

  const [jobs, setJobs] = useState<RebrandJob[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ url: string; job: RebrandJob } | null>(null);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [isChatSending, setIsChatSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;

    if (jobs.length + files.length > MAX_IMAGES) {
      setError(`You can only upload up to ${MAX_IMAGES} images at once.`);
      return;
    }
    setError(null);

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setJobs(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            sourceImage: reader.result as string,
            resultImage: null,
            status: 'idle',
            fileName: file.name,
            chatHistory: [],
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const clearAllJobs = () => {
    setJobs([]);
    setError(null);
  };

  const handleRebrandAll = async () => {
    if (jobs.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    if (!brandAssets.whiteLogo && !brandAssets.blackLogo && !brandAssets.brandName) {
      setError('Please provide at least a logo or brand name in the sidebar.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const jobsToProcess = jobs.filter(job => job.status !== 'completed');

    if (jobsToProcess.length === 0) {
      setIsProcessing(false);
      return;
    }

    setJobs(prev =>
      prev.map(j =>
        jobsToProcess.some(pending => pending.id === j.id)
          ? { ...j, status: 'processing' as const, errorMessage: undefined }
          : j
      )
    );

    const jobPromises = jobsToProcess.map(async job => {
      try {
        const generatedImage = await rebrandImage({
          sourceImage: job.sourceImage,
          whiteLogo: brandAssets.whiteLogo || undefined,
          blackLogo: brandAssets.blackLogo || undefined,
          brandName: brandAssets.brandName || undefined,
          instructions: prompt || undefined,
        });

        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: 'completed' as const, resultImage: generatedImage } : j)));
      } catch (err: any) {
        if (err.message && err.message.includes('Requested entity was not found')) {
          setError('Session expired or invalid API key. Please reconnect your key.');
        }
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: 'error' as const, errorMessage: err.message || 'Failed' } : j)));
      }
    });

    await Promise.all(jobPromises);
    setIsProcessing(false);
  };

  const handleDownloadSingle = (job: RebrandJob) => {
    if (!job.resultImage) return;
    saveAs(job.resultImage, `rebranded-${job.fileName}`);
  };

  const handleDownloadAll = async () => {
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.resultImage);
    if (completedJobs.length === 0) return;

    if (completedJobs.length === 1) {
      handleDownloadSingle(completedJobs[0]);
      return;
    }

    const zip = new JSZip();
    completedJobs.forEach(job => {
      if (job.resultImage) {
        const base64Data = job.resultImage.split(',')[1];
        zip.file(`rebranded-${job.fileName}`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'personal-agent-rebranded-images.zip');
  };

  const handleRegenerateSingle = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'processing' as const, errorMessage: undefined, resultImage: null } : j)));

    try {
      const generatedImage = await rebrandImage({
        sourceImage: job.sourceImage,
        whiteLogo: brandAssets.whiteLogo || undefined,
        blackLogo: brandAssets.blackLogo || undefined,
        brandName: brandAssets.brandName || undefined,
        instructions: prompt || undefined,
      });
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'completed' as const, resultImage: generatedImage } : j)));
    } catch (err: any) {
      if (err.message && err.message.includes('Requested entity was not found')) {
        setError('Session expired or invalid API key. Please reconnect your key.');
      }
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'error' as const, errorMessage: err.message || 'Failed' } : j)));
    }
  };

  const handleChatMessage = async (jobId: string, message: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.resultImage) return;

    const userMsg = { id: Math.random().toString(36).substr(2, 9), role: 'user' as const, text: message, timestamp: Date.now() };
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, chatHistory: [...j.chatHistory, userMsg] } : j)));
    setIsChatSending(true);

    try {
      const newImage = await editImage({ currentImage: job.resultImage, userMessage: message });
      const modelMsg = { id: Math.random().toString(36).substr(2, 9), role: 'model' as const, text: 'Applied', image: newImage, timestamp: Date.now() };
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, resultImage: newImage, chatHistory: [...j.chatHistory, modelMsg] } : j)));
    } catch (err: any) {
      const errorMsg = { id: Math.random().toString(36).substr(2, 9), role: 'model' as const, text: `Error: ${err.message || 'Failed'}`, timestamp: Date.now() };
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, chatHistory: [...j.chatHistory, errorMsg] } : j)));
    }

    setIsChatSending(false);
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;

  return (
    <>
      <BrandSidebar assets={brandAssets} setAssets={setBrandAssets} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full min-w-0">
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 pb-40 sm:pb-32">
            {/* Top Bar: Upload & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between card-bright p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden group gap-4">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-brand-surface-container to-brand-surface-container rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-4xl font-bold font-display gradient-text mb-1 sm:mb-2">Creative Workboard</h2>
                <p className="text-brand-on-surface-variant max-w-lg text-sm sm:text-base font-medium">Upload your assets and watch the magic happen.</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full sm:w-auto">
                <div className="relative overflow-hidden inline-block">
                  <FileUpload label="Upload Images" onFileSelect={handleAddFiles} className="w-auto" compact multiple />
                </div>
                {jobs.length > 0 && (
                  <Button variant="outline" onClick={clearAllJobs} disabled={isProcessing} className="h-10 sm:h-[50px] text-sm">
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Gallery Grid */}
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-80 border-2 border-dashed border-brand-outline-variant rounded-2xl sm:rounded-3xl bg-brand-surface-container/60 backdrop-blur-sm group hover:border-brand-primary hover:bg-brand-surface-container-high transition-all duration-300 p-4">
                <div className="bg-gradient-to-r from-brand-surface-container to-brand-surface-container p-5 sm:p-8 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 relative group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-primary/20 blur-2xl rounded-full" />
                  <Images className="text-brand-primary w-10 h-10 sm:w-14 sm:h-14 relative z-10" />
                </div>
                <p className="text-brand-on-surface font-display font-bold text-lg sm:text-2xl mb-1 sm:mb-2 text-center">Your canvas is empty</p>
                <p className="text-brand-primary font-medium text-sm sm:text-base text-center">Upload images to begin your rebranding journey</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                  <div key={job.id} className="card-bright rounded-2xl overflow-hidden shadow-lg flex flex-col group/card border-2 border-brand-surface-container hover:border-brand-outline-variant hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {/* Status Bar */}
                    <div className="px-4 py-3 border-b border-brand-surface-container flex items-center justify-between bg-gradient-to-r from-brand-surface-container-high to-brand-surface-container-high">
                      <span className="truncate max-w-[150px] font-semibold text-brand-on-surface text-sm" title={job.fileName}>
                        {job.fileName}
                      </span>
                      <div className="flex items-center gap-3">
                        {job.status === 'idle' && (
                          <span className="text-brand-on-surface-variant text-xs flex items-center gap-1.5 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Pending
                          </span>
                        )}
                        {job.status === 'processing' && (
                          <span className="text-brand-primary text-xs flex items-center gap-1.5 font-semibold">
                            <Loader2 size={12} className="animate-spin" /> Processing
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <span className="text-emerald-400 text-xs flex items-center gap-1.5 font-semibold">
                            <CheckCircle size={12} /> Done
                          </span>
                        )}
                        {job.status === 'error' && (
                          <span className="text-rose-400 text-xs flex items-center gap-1.5 font-semibold">
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}

                        {job.status !== 'processing' && (
                          <button onClick={() => removeJob(job.id)} className="text-brand-on-surface-variant hover:text-rose-500 transition-colors p-1 hover:bg-rose-900/30 rounded">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Comparison Area */}
                    <div className="flex flex-col xs:flex-row h-auto xs:h-56 relative group/image">
                      {/* Source */}
                      <div className="flex-1 bg-slate-800 relative border-b xs:border-b-0 xs:border-r border-slate-700 flex items-center justify-center p-2 min-h-[120px]">
                        <img src={job.sourceImage} className="max-w-full max-h-full object-contain opacity-80 group-hover/image:opacity-100 transition-opacity" alt="Original" />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded backdrop-blur-md font-medium tracking-wide">ORIGINAL</div>
                      </div>

                      {/* Result */}
                      <div className="flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden min-h-[120px]">
                        {job.status === 'completed' && job.resultImage ? (
                          <div
                            className="relative w-full h-full cursor-zoom-in group-hover/card:opacity-95 transition-all text-center flex items-center justify-center p-2"
                            onClick={() => setPreviewData({ url: job.resultImage!, job })}
                          >
                            <img src={job.resultImage} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Rebranded" />
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-brand-primary to-brand-primary text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium tracking-wide shadow-lg">NEW LOOK</div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 bg-black/40 transition-opacity backdrop-blur-[2px]">
                              <Maximize2 className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] transform scale-90 group-hover/card:scale-100 transition-transform duration-300" size={28} />
                            </div>
                          </div>
                        ) : job.status === 'error' ? (
                          <div className="p-3 sm:p-4 text-center">
                            <p className="text-xs text-rose-400 leading-relaxed bg-rose-900/30 px-3 py-2 rounded-lg border border-rose-200">{job.errorMessage || 'Error'}</p>
                          </div>
                        ) : (
                          <div className="text-slate-600 flex flex-col items-center gap-3">
                            {job.status === 'processing' ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-brand-primary blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="animate-spin relative z-10 text-brand-primary" size={24} />
                              </div>
                            ) : (
                              <ArrowRight size={24} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-2 sm:p-3 border-t border-brand-surface-container flex justify-between items-center bg-gradient-to-r from-brand-surface-container-high/50 to-brand-surface-container-high/50">
                      <div>
                        {(job.status === 'completed' || job.status === 'error') && (
                          <button
                            onClick={() => handleRegenerateSingle(job.id)}
                            disabled={job.status === 'processing'}
                            className="text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-brand-surface-container-high rounded-lg"
                          >
                            <RefreshCw size={14} /> <span className="hidden sm:inline">Regenerate</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'completed' && (
                          <button
                            onClick={() => setChatJobId(job.id)}
                            className="text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-brand-surface-container-high rounded-lg"
                          >
                            <MessageSquare size={14} /> Edit
                          </button>
                        )}
                        {job.status === 'completed' && (
                          <button
                            onClick={() => handleDownloadSingle(job)}
                            className="text-xs font-bold text-white bg-gradient-to-r from-brand-primary to-brand-primary hover:shadow-lg flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                          >
                            <Download size={14} /> Save
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Bottom Control Bar */}
        <div className="border-t border-brand-outline-variant bg-brand-surface-container-highest/90 backdrop-blur-xl p-3 sm:p-6 sticky bottom-0 z-20 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)]">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {error && (
              <div className="bg-rose-900/30 border-2 border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-lg">
                <div className="p-1 bg-rose-200 rounded-full">
                  <Info size={14} />
                </div>{' '}
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
              <div className="flex-1 space-y-1 sm:space-y-2">
                <label className="text-xs font-bold bg-gradient-to-r from-brand-primary to-brand-primary bg-clip-text text-transparent uppercase tracking-wider flex items-center gap-2 pl-1">
                  <Sparkles size={12} /> Global Instructions
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-brand-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe your vision (e.g., 'Cyberpunk style, neon lights, dark background')..."
                    className="relative w-full pl-5 pr-12 py-4 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-brand-on-surface placeholder-brand-primary resize-none h-16 min-h-[64px] max-h-32 transition-all shadow-sm font-medium"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRebrandAll();
                      }
                    }}
                  />
                  <div className="absolute right-3 bottom-3 z-10">
                    <button className="p-1.5 text-brand-primary rounded-lg hover:text-brand-primary hover:bg-brand-surface-container-high transition-colors" title="Clear prompt" onClick={() => setPrompt('')}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleRebrandAll}
                  disabled={jobs.length === 0 || isProcessing || (!brandAssets.whiteLogo && !brandAssets.blackLogo && !brandAssets.brandName)}
                  className="flex-1 sm:flex-none h-12 sm:h-16 px-4 sm:px-8 rounded-xl min-w-0 sm:min-w-[180px] text-base sm:text-lg font-semibold"
                  isLoading={isProcessing}
                >
                  <span className="flex items-center gap-2">
                    Visualise <Send size={20} className={isProcessing ? 'hidden' : ''} />
                  </span>
                </Button>

                {completedCount > 0 && (
                  <Button onClick={handleDownloadAll} variant="secondary" className="flex-1 sm:flex-none h-8 text-xs font-medium">
                    <Download size={12} className="mr-1" />
                    Save All ({completedCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full Image Modal */}
        <ImageModal isOpen={!!previewData} imageUrl={previewData?.url || null} fileName={previewData?.job.fileName} onClose={() => setPreviewData(null)} onDownload={() => previewData && handleDownloadSingle(previewData.job)} />

        {/* Per-Image Chat Panel */}
        {chatJobId && jobs.find(j => j.id === chatJobId) && <ChatPanel job={jobs.find(j => j.id === chatJobId)!} isOpen={!!chatJobId} onClose={() => setChatJobId(null)} onSendMessage={handleChatMessage} isSending={isChatSending} />}
      </div>
    </>
  );
};
