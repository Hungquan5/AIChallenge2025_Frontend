import React from 'react';
import { Image, Check } from 'lucide-react';
import {
  containerClass,
  labelClass,
  fileInputClass,
  uploadAreaClass,
  uploadedTextClass,
  emptyStateClass,
  iconClass,
  filenameClass,
  emptyTextClass,
} from './styles';

interface ImageInputBoxProps {
  selectedImage: File | null;
  onSelectImage: (file: File | null) => void;
}

const ImageInputBox: React.FC<ImageInputBoxProps> = ({ selectedImage, onSelectImage }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onSelectImage(file);
  };

  return (
    <div className={containerClass}>
      <label className={labelClass}>Upload Image</label>
      <input
        type="file"
        accept="image/*"
        id="image-upload"
        className={fileInputClass}
        onChange={handleFileChange}
      />
      <label htmlFor="image-upload" className={uploadAreaClass}>
        {selectedImage ? (
          <div className={uploadedTextClass}>
            <Check className={iconClass} />
            <span className={filenameClass}>{selectedImage.name}</span>
          </div>
        ) : (
          <div className={emptyStateClass}>
            <Image className={iconClass} />
            <span className={emptyTextClass}>Click or drag to upload an image</span>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageInputBox;
