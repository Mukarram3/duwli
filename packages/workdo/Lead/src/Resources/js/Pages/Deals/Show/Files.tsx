import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import MediaPicker from '@/components/MediaPicker';
import { getImagePath, downloadFile } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Image, File, FileText, Video, Music, Download, Eye, Trash2 } from 'lucide-react';
import { Deal } from '../types';

interface FilesProps {
    deal: Deal;
}

export default function Files({ deal }: FilesProps) {
    const { t } = useTranslation();
    const [images, setImages] = useState<string[]>([]);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <Image className="h-5 w-5 text-blue-500" />;
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) return <Video className="h-5 w-5 text-purple-500" />;
        if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) return <Music className="h-5 w-5 text-green-500" />;
        if (['txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext || '')) return <FileText className="h-5 w-5 text-red-500" />;
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const isImage = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-6">
                <h3 className="text-lg font-bold text-foreground capitalize">{t('Files')}</h3>
            </div>
            <div className="mb-4">
                <MediaPicker
                    value={images}
                    onChange={(value) => {
                        const items = Array.isArray(value) ? value : [value].filter(Boolean);
                        if (items.length > 0) {
                            router.post(route('lead.deals.store-file', deal.id), { images: items }, {
                                onSuccess: () => setImages([]),
                            });
                        }
                    }}
                    multiple={true}
                    placeholder={t('Select files')}
                    showPreview={false}
                    label=""
                />
            </div>
            {deal.files && deal.files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ltr:pr-1 rtl:pl-1">
                    {deal.files.map((file) => {
                        const imageUrl = getImagePath(file.file_path);
                        return (
                            <div key={file.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-muted border flex items-center justify-center flex-shrink-0">
                                        {isImage(file.file_path) ? (
                                            <a
                                                href={imageUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full h-full block"
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={file.file_name}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                                                />
                                            </a>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-muted">
                                                {getFileIcon(file.file_name)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-sm text-foreground truncate" title={file.file_name}>
                                            {file.file_name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {file.file_name.split('.').pop()?.toUpperCase()} file
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="ghost" onClick={() => window.open(imageUrl, '_blank')} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="ghost" onClick={() => downloadFile(imageUrl)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('Download')}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="ghost" onClick={() => router.delete(route('lead.deals.delete-file', { deal: deal.id, file: file.id }))} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground/60 bg-muted/5 rounded-xl border border-dashed border-border/40">
                    <File className="h-8 w-8 mx-auto mb-2.5 opacity-30 text-primary" />
                    <p className="text-sm font-semibold capitalize">{t('No files uploaded yet')}</p>
                </div>
            )}
        </div>
    );
}