import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StickyNote, Edit, Trash2, Send } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, getImagePath } from '@/utils/helpers';

interface NotesTabProps {
    contract: any;
    setDeleteConfig: (config: any) => void;
}

export default function NotesTab({ contract, setDeleteConfig }: NotesTabProps) {
    const { t } = useTranslation();
    const pageProps = usePage<any>().props;
    const { auth } = pageProps;
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [editNoteId, setEditNoteId] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [createNoteText, setCreateNoteText] = useState('');
    
    const notesContainerRef = useRef<HTMLDivElement>(null);

    const sortedNotes = [...(contract.notes || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const scrollToBottom = () => {
        if (notesContainerRef.current) {
            notesContainerRef.current.scrollTo({
                top: notesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [contract.notes?.length]);

    const handleNoteSubmit = () => {
        if (editNoteId) {
            router.put(route('contract-notes.update', editNoteId), { note: noteText }, {
                onSuccess: () => {
                    setNoteDialogOpen(false);
                    setNoteText('');
                    setEditNoteId(null);
                    router.reload();
                }
            });
        } else {
            router.post(route('contract-notes.store', contract.id), { note: noteText }, {
                onSuccess: () => {
                    setNoteDialogOpen(false);
                    setNoteText('');
                    router.reload();
                }
            });
        }
    };

    const handleCreateNoteSubmit = () => {
        router.post(route('contract-notes.store', contract.id), { note: createNoteText }, {
            onSuccess: () => {
                setCreateNoteText('');
                router.reload();
            }
        });
    };

    const openEditNote = (note: any) => {
        setEditNoteId(note.id);
        setNoteText(note.note);
        setNoteDialogOpen(true);
    };

    return (
        <>
            <Card className="border border-gray-300 dark:border-slate-700 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {t('Notes')}
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 ms-2 text-xs font-semibold rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                            {contract.notes?.length || 0}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col space-y-4">
                    {/* Notes List Section */}
                    <div ref={notesContainerRef} className="max-h-[580px] min-h-[420px] overflow-y-auto pe-2 space-y-6 relative">
                        {sortedNotes && sortedNotes.length > 0 ? (
                            sortedNotes.map((note: any, index: number) => (
                                <div key={note.id} className="relative flex items-start gap-4 w-full">
                                    {/* Timeline Connector Line */}
                                    {index < sortedNotes.length - 1 && (
                                        <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-slate-800 -translate-x-1/2" />
                                    )}
                                    <Avatar className="h-8 w-8 flex-shrink-0 relative z-10">
                                        <AvatarImage src={note.user?.avatar ? getImagePath(note.user.avatar, pageProps) : note.user?.profile_photo_url} alt={note.user?.name} />
                                        <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                            {note.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-205">
                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{note.user?.name}</span>
                                                <span className="text-[11px] text-gray-400 font-medium">{formatDateTime(note.created_at)}</span>
                                            </div>
                                            {(note.user_id === auth.user?.id || note.created_by === auth.user?.id) && (
                                                <TooltipProvider>
                                                    <div className="flex gap-1">
                                                        {auth.user?.permissions?.includes('edit-contract-notes') && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openEditNote(note)} className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Edit')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-contract-notes') && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfig({
                                                                        type: 'note',
                                                                        id: note.id,
                                                                        route: 'contract-notes.destroy',
                                                                        message: t('Are you sure you want to delete this note?')
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
                                        <div className="mt-2 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <StickyNote className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{t('No notes yet')}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Textarea Input Area at Bottom */}
                    {auth.user?.permissions?.includes('create-contract-notes') && (
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 border border-gray-150 dark:border-slate-800 rounded-lg p-4 mt-2">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={auth.user?.avatar ? getImagePath(auth.user.avatar, pageProps) : auth.user?.profile_photo_url} alt={auth.user?.name} />
                                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                        {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 relative">
                                    <Textarea
                                        value={createNoteText}
                                        onChange={(e) => setCreateNoteText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (createNoteText.trim()) {
                                                    handleCreateNoteSubmit();
                                                }
                                            }
                                        }}
                                        placeholder={t('Write your note...')}
                                        rows={2}
                                        className="resize-none pe-12 pb-3 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20 rounded-lg w-full min-h-[80px]"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleCreateNoteSubmit} 
                                        disabled={!createNoteText.trim()}
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

            {editNoteId && (
                <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader className="pb-4">
                            <DialogTitle className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4" />
                                {t('Edit Note')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={auth.user?.avatar ? getImagePath(auth.user.avatar, pageProps) : auth.user?.profile_photo_url} alt={auth.user?.name} />
                                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                        {auth.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-2">{auth.user?.name}</p>
                                    <Textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder={t('Write your note...')}
                                        rows={3}
                                        className="resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => {
                                setNoteDialogOpen(false);
                                setNoteText('');
                                setEditNoteId(null);
                            }}>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={handleNoteSubmit} disabled={!noteText.trim()}>
                                {t('Update')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}