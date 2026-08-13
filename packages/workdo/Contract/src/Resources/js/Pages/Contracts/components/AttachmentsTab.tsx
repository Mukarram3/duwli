import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MediaPicker from '@/components/MediaPicker';
import { Upload, Download, Trash2, Eye, Paperclip, File, Image } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getImagePath, downloadFile } from '@/utils/helpers';

interface AttachmentsTabProps {
    contract: any;
    setDeleteConfig: (config: any) => void;
}

export default function AttachmentsTab({ contract, setDeleteConfig }: AttachmentsTabProps) {
    const { t } = useTranslation();
    const pageProps = usePage<any>().props;
    const { auth } = pageProps;
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const pdfTypes = ['pdf'];

        if (imageTypes.includes(extension || '')) return <Image className="h-4 w-4" />;
        if (pdfTypes.includes(extension || '')) return <File className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const isImageFile = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
    };

    const handleAttachmentUpload = () => {
        if (selectedMedia.length > 0) {
            router.post(route('contract-attachments.store', contract.id), {
                media_paths: selectedMedia
            }, {
                onSuccess: () => {
                    setAttachmentDialogOpen(false);
                    setSelectedMedia([]);
                    router.reload();
                }
            });
        }
    };

    return (
        <>
            <Card className="border border-gray-300 dark:border-slate-700 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('Attachments')}</CardTitle>
                    <div className="flex items-center gap-2">
                        {auth.user?.permissions?.includes('create-contract-attachments') && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" onClick={() => setAttachmentDialogOpen(true)} className="h-9">
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Upload')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[520px] overflow-y-auto">
                    {contract.attachments && contract.attachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {contract.attachments.map((attachment: any) => (
                                <div key={attachment.id} className="group relative bg-white dark:bg-slate-900 border border-gray-150 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-all duration-205">
                                    <div 
                                        className="aspect-square bg-gray-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer relative"
                                        onClick={() => window.open(getImagePath(attachment.file_path, pageProps), '_blank')}
                                    >
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-colors duration-200 z-10" />
                                        {auth.user?.permissions?.includes('view-contracts') ? (
                                            isImageFile(attachment.file_name) ? (
                                                <img
                                                    src={getImagePath(attachment.file_path, pageProps)}
                                                    alt={attachment.file_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-gray-400">
                                                    {getFileIcon(attachment.file_name)}
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-gray-400">
                                                {getFileIcon(attachment.file_name)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900">
                                        <div className="flex items-center justify-between">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="h-6 w-6 flex-shrink-0 cursor-pointer">
                                                            <AvatarImage src={attachment.uploader?.avatar ? getImagePath(attachment.uploader.avatar, pageProps) : attachment.uploader?.profile_photo_url} alt={attachment.uploader?.name} />
                                                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 font-semibold">
                                                                {attachment.uploader?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{attachment.uploader?.name || t('Unknown')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {auth.user?.permissions?.includes('view-contracts') && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="ghost" onClick={() => downloadFile(getImagePath(attachment.file_path, pageProps))} className="h-6 w-6 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Download')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-contract-attachments') && (attachment.uploaded_by === auth.user?.id || attachment.created_by === auth.user?.id) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfig({
                                                                    type: 'attachment',
                                                                    id: attachment.id,
                                                                    route: 'contract-attachments.destroy',
                                                                    message: t('Are you sure you want to delete this attachment?')
                                                                })} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Delete')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Paperclip className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">{t('No attachments found')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
                <DialogContent>
                    <DialogHeader className="mb-4">
                        <DialogTitle>{t('Add Attachments')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <MediaPicker
                            multiple
                            value={selectedMedia}
                            onChange={(media) => setSelectedMedia(media as string[])}
                            showPreview={true}
                            placeholder={t('Select files to attach...')}
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAttachmentDialogOpen(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleAttachmentUpload} disabled={selectedMedia.length === 0}>
                            {t('Upload')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}