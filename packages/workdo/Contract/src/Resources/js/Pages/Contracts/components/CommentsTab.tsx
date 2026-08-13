import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Edit, Trash2, Send } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, getImagePath } from '@/utils/helpers';

interface CommentsTabProps {
    contract: any;
    setDeleteConfig: (config: any) => void;
}

export default function CommentsTab({ contract, setDeleteConfig }: CommentsTabProps) {
    const { t } = useTranslation();
    const pageProps = usePage<any>().props;
    const { auth } = pageProps;
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState('');
    const [createCommentText, setCreateCommentText] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const sortedComments = [...(contract.comments || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [contract.comments?.length]);

    const handleCommentSubmit = () => {
        if (editCommentId) {
            router.put(route('contract-comments.update', editCommentId), { comment: commentText }, {
                onSuccess: () => {
                    setCommentDialogOpen(false);
                    setCommentText('');
                    setEditCommentId(null);
                    router.reload();
                }
            });
        } else {
            router.post(route('contract-comments.store', contract.id), { comment: commentText }, {
                onSuccess: () => {
                    setCommentDialogOpen(false);
                    setCommentText('');
                    router.reload();
                }
            });
        }
    };

    const handleCreateCommentSubmit = () => {
        router.post(route('contract-comments.store', contract.id), { comment: createCommentText }, {
            onSuccess: () => {
                setCreateCommentText('');
                router.reload();
            }
        });
    };

    const openEditComment = (comment: any) => {
        setEditCommentId(comment.id);
        setCommentText(comment.comment);
        setCommentDialogOpen(true);
    };

    return (
        <>
            <Card className="border border-gray-300 dark:border-slate-700 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t('Comments')}
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 ms-2 text-xs font-semibold rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                            {contract.comments?.length || 0}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col space-y-4">
                    {/* Comments List Section */}
                    <div ref={chatContainerRef} className="max-h-[580px] min-h-[420px] overflow-y-auto pe-2 space-y-6 relative">
                        {sortedComments && sortedComments.length > 0 ? (
                            sortedComments.map((comment: any, index: number) => (
                                <div key={comment.id} className="relative flex items-start gap-4 w-full">
                                    {/* Timeline Connector Line */}
                                    {index < sortedComments.length - 1 && (
                                        <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-slate-800 -translate-x-1/2" />
                                    )}
                                    <Avatar className="h-8 w-8 flex-shrink-0 relative z-10">
                                        <AvatarImage src={comment.user?.avatar ? getImagePath(comment.user.avatar, pageProps) : comment.user?.profile_photo_url} alt={comment.user?.name} />
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                            {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-205">
                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.user?.name}</span>
                                                <span className="text-[11px] text-gray-400 font-medium">{formatDateTime(comment.created_at)}</span>
                                            </div>
                                            {(comment.user_id === auth.user?.id || comment.created_by === auth.user?.id) && (
                                                <TooltipProvider>
                                                    <div className="flex gap-1">
                                                        {auth.user?.permissions?.includes('edit-contract-comments') && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openEditComment(comment)} className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Edit')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-contract-comments') && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfig({
                                                                        type: 'comment',
                                                                        id: comment.id,
                                                                        route: 'contract-comments.destroy',
                                                                        message: t('Are you sure you want to delete this comment?')
                                                                    })} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Delete')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{comment.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{t('No comments yet')}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Textarea Input Area at Bottom */}
                    {auth.user?.permissions?.includes('create-contract-comments') && (
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 border border-gray-150 dark:border-slate-800 rounded-lg p-4 mt-2">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={auth.user?.avatar ? getImagePath(auth.user.avatar, pageProps) : auth.user?.profile_photo_url} alt={auth.user?.name} />
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                        {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 relative">
                                    <Textarea
                                        value={createCommentText}
                                        onChange={(e) => setCreateCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (createCommentText.trim()) {
                                                    handleCreateCommentSubmit();
                                                }
                                            }
                                        }}
                                        placeholder={t('Write your comment...')}
                                        rows={2}
                                        className="resize-none pe-12 pb-3 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20 rounded-lg w-full min-h-[80px]"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleCreateCommentSubmit} 
                                        disabled={!createCommentText.trim()}
                                        className="absolute end-3 bottom-3 p-1.5 text-gray-400 hover:text-primary disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {editCommentId && (
                <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader className="pb-4">
                            <DialogTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                {t('Edit Comment')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={auth.user?.avatar ? getImagePath(auth.user.avatar, pageProps) : auth.user?.profile_photo_url} alt={auth.user?.name} />
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                        {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-2">{auth.user?.name}</p>
                                    <Textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={t('Write your comment...')}
                                        rows={3}
                                        className="resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => {
                                setCommentDialogOpen(false);
                                setCommentText('');
                                setEditCommentId(null);
                            }}>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                                {t('Update')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}