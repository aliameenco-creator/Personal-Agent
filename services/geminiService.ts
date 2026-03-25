import { RebrandRequest, EditRequest } from '../types';
import { stripImageMetadata } from '../utils/stripMetadata';
import { apiPost } from './apiClient';

// Helper to get image dimensions (client-side)
const getImageDimensions = (base64: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });
};

const getClosestAspectRatio = (width: number, height: number): string => {
  const targetRatio = width / height;
  const supported = [
    { name: "1:1", value: 1 },
    { name: "3:4", value: 3/4 },
    { name: "4:3", value: 4/3 },
    { name: "9:16", value: 9/16 },
    { name: "16:9", value: 16/9 },
  ];
  return supported.reduce((prev, curr) =>
    Math.abs(curr.value - targetRatio) < Math.abs(prev.value - targetRatio) ? curr : prev
  ).name;
};

export const rebrandImage = async (request: RebrandRequest): Promise<string> => {
  const { sourceImage, whiteLogo, blackLogo, instructions, brandName } = request;

  const { width, height } = await getImageDimensions(sourceImage);
  const aspectRatio = getClosestAspectRatio(width, height);

  const { image } = await apiPost('rebrand', {
    sourceImage,
    whiteLogo,
    blackLogo,
    instructions,
    brandName,
    aspectRatio,
  });

  return stripImageMetadata(image);
};

export const editImage = async (request: EditRequest): Promise<string> => {
  const { currentImage, userMessage } = request;

  const { width, height } = await getImageDimensions(currentImage);
  const aspectRatio = getClosestAspectRatio(width, height);

  const { image } = await apiPost('edit-image', {
    currentImage,
    userMessage,
    aspectRatio,
  });

  return stripImageMetadata(image);
};
