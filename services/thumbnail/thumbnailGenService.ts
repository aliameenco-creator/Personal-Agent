import { UploadedImage } from '../../types/thumbnail';
import { stripImageMetadata } from '../../utils/stripMetadata';
import { apiPost } from '../apiClient';

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ data: base64String, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateThumbnailFromPrompt = async (
  prompt: string,
  userImage: UploadedImage | null,
  referenceImages: UploadedImage[]
): Promise<string> => {
  const userImageData = userImage ? await fileToBase64(userImage.file) : null;
  const refData = await Promise.all(referenceImages.map(ref => fileToBase64(ref.file)));

  const { image } = await apiPost('thumbnail/generate', {
    prompt,
    userImage: userImageData,
    referenceImages: refData,
  });

  return stripImageMetadata(image);
};

export const editThumbnail = async (
  currentImageDataUrl: string,
  editPrompt: string,
  attachments: File[] = []
): Promise<string> => {
  const attachmentData = await Promise.all(attachments.map(f => fileToBase64(f)));

  const { image } = await apiPost('thumbnail/edit', {
    currentImage: currentImageDataUrl,
    editPrompt,
    attachments: attachmentData,
  });

  return stripImageMetadata(image);
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(audioBlob);
  });

  const { text } = await apiPost('thumbnail/transcribe', {
    audioData: base64Audio,
    mimeType: 'audio/wav',
  });

  return text;
};
