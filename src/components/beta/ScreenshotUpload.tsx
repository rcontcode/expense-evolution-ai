import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useBetaSystem } from '@/hooks/data/useBetaSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface ScreenshotUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export const ScreenshotUpload = ({ onUpload, currentUrl }: ScreenshotUploadProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { uploadScreenshot } = useBetaSystem();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    es: {
      label: '📸 Captura de pantalla (opcional)',
      hint: 'Sube una imagen que ayude a entender mejor tu feedback',
      upload: 'Subir imagen',
      uploading: 'Subiendo...',
      remove: 'Quitar imagen',
      dragDrop: 'Arrastra una imagen aquí o haz clic',
      maxSize: 'Máximo 5MB • PNG, JPG, GIF',
      success: '¡Imagen subida correctamente!',
      error: 'Error al subir la imagen',
    },
    en: {
      label: '📸 Screenshot (optional)',
      hint: 'Upload an image that helps understand your feedback better',
      upload: 'Upload image',
      uploading: 'Uploading...',
      remove: 'Remove image',
      dragDrop: 'Drag an image here or click',
      maxSize: 'Max 5MB • PNG, JPG, GIF',
      success: 'Image uploaded successfully!',
      error: 'Error uploading image',
    },
  };

  const text = t[language];

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadScreenshot(file);
      
      if (url) {
        setPreviewUrl(url);
        onUpload(url);
        toast({
          title: '✅ ' + text.success,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setPreviewUrl(null);
      toast({
        title: text.error,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Camera className="h-4 w-4" />
        {text.label}
      </Label>
      <p className="text-xs text-muted-foreground">{text.hint}</p>

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-xl overflow-hidden border-2 border-primary/20"
          >
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4 mr-1" />
              {text.remove}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
            
            <div className="text-center">
              {isUploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 className="h-12 w-12 mx-auto text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="inline-flex p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"
                >
                  <Upload className="h-8 w-8" />
                </motion.div>
              )}
              
              <p className="mt-4 font-medium text-foreground">
                {isUploading ? text.uploading : text.dragDrop}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text.maxSize}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
