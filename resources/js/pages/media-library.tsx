import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Upload, Search, Plus, Info, Copy, Download, X, MoreHorizontal, MoreVertical, Image as ImageIcon, Calendar, HardDrive, Edit, Trash2, Folder, FolderOpen, Home, Grid3X3, List, Eye } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  url: string;
  thumb_url: string;
  size: number;
  mime_type: string;
  created_at: string;
  directory_id: number | null;
}

interface Directory {
  id: number;
  name: string;
  slug: string;
}

// Ensure `route` is recognized as a global function (standard in Laravel+Inertia via Ziggy)
declare const route: any;

export default function MediaLibrary() {
  const { t } = useTranslation();
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  // Data states
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<number | null>(null);

  // Filter & Layout states
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Folder modal states
  const [showCreateDirectory, setShowCreateDirectory] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [editingDirectoryId, setEditingDirectoryId] = useState<number | null>(null);
  const [editDirectoryName, setEditDirectoryName] = useState('');
  const [deleteDirectoryTarget, setDeleteDirectoryTarget] = useState<Directory | null>(null);

  // File modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<{ id: number; name: string } | null>(null);

  // Fetch logic
  const fetchMedia = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const allResponse = await fetch(route('media.index'), {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });
      if (!allResponse.ok) throw new Error('Network response was not ok');
      const allData = await allResponse.json();
      const allArray: MediaItem[] = Array.isArray(allData.media) ? allData.media : [];
      setAllMedia(allArray);
      setDirectories(allData.directories || []);

      if (currentDirectory) {
        const params = new URLSearchParams({ directory_id: currentDirectory.toString() });
        const res = await fetch(`${route('media.index')}?${params}`, {
          headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });
        const data = await res.json();
        setMedia(Array.isArray(data.media) ? data.media : []);
      } else {
        setMedia(allArray);
      }
    } catch {
      toast.error(t('Failed to load media'));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [currentDirectory, t]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Filter & Sort Logic
  useEffect(() => {
    let filtered = media.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'name': aValue = a.name.toLowerCase(); bValue = b.name.toLowerCase(); break;
        case 'date': aValue = new Date(a.created_at).getTime(); bValue = new Date(b.created_at).getTime(); break;
        case 'size': aValue = a.size; bValue = b.size; break;
        case 'type': aValue = a.mime_type; bValue = b.mime_type; break;
        default: aValue = new Date(a.created_at).getTime(); bValue = new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    setFilteredMedia(filtered);
    setCurrentPage(1);
  }, [searchTerm, media, sortBy, sortOrder]);


  // Folder CRUD Logics
  const createDirectory = async () => {
    if (!newDirectoryName.trim()) return;
    try {
      const res = await fetch(route('media.directories.create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ name: newDirectoryName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t('Directory created successfully'));
        setNewDirectoryName('');
        setShowCreateDirectory(false);
        fetchMedia(false);
      } else toast.error(data.message || t('Failed to create directory'));
    } catch {
      toast.error(t('Error creating directory'));
    }
  };

  const updateDirectory = async () => {
    if (!editDirectoryName.trim() || !editingDirectoryId) return;
    try {
      const res = await fetch(route('media.directories.update', editingDirectoryId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ name: editDirectoryName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t('Directory updated successfully'));
        setEditingDirectoryId(null);
        setEditDirectoryName('');
        fetchMedia(false);
      } else toast.error(data.message || t('Failed to update directory'));
    } catch {
      toast.error(t('Error updating directory'));
    }
  };

  const deleteDirectory = async () => {
    if (!deleteDirectoryTarget) return;
    try {
      const res = await fetch(route('media.directories.destroy', deleteDirectoryTarget.id), {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrfToken },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t('Directory deleted successfully'));
        if (currentDirectory === deleteDirectoryTarget.id) setCurrentDirectory(null);
        setDeleteDirectoryTarget(null);
        fetchMedia(false);
      } else toast.error(data.message || t('Failed to delete directory'));
    } catch {
      toast.error(t('Error deleting directory'));
    }
  };

  // Upload Logic
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files[]', f));
    if (currentDirectory) formData.append('directory_id', currentDirectory.toString());

    try {
      const res = await fetch(route('media.batch'), {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        body: formData,
        credentials: 'same-origin',
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        result.errors?.forEach((e: string) => toast.error(e));
        fetchMedia(false);
      } else {
        (result.errors ?? [result.message]).forEach((e: string) => toast.error(e));
      }
    } catch {
      toast.error(t('Error uploading files'));
    }
    setUploading(false);
    setIsUploadModalOpen(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files);
  };

  // Delete Media Logic
  const deleteMedia = async () => {
    if (!deleteFileTarget) return;
    try {
      const res = await fetch(route('media.destroy', deleteFileTarget.id), {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        setMedia(prev => prev.filter(m => m.id !== deleteFileTarget.id));
        setAllMedia(prev => prev.filter(m => m.id !== deleteFileTarget.id));
        toast.success(t('Media deleted successfully'));
      } else toast.error(t('Failed to delete media'));
    } catch {
      toast.error(t('Error deleting media'));
    }
    setDeleteFileTarget(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(t('URL copied to clipboard'));
  };

  const handleDownload = (id: number, filename: string) => {
    const a = document.createElement('a');
    a.href = route('media.download', id);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('Download started'));
  };

  const handleShowInfo = (item: MediaItem) => {
    setSelectedMediaInfo(item);
    setInfoModalOpen(true);
  };

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mime.includes('pdf')) return <div className="p-1 min-w-[2rem] bg-red-500 rounded text-white text-[10px] flex items-center justify-center font-bold">PDF</div>;
    if (mime.includes('word') || mime.includes('document')) return <div className="p-1 min-w-[2rem] bg-blue-500 rounded text-white text-[10px] flex items-center justify-center font-bold">DOC</div>;
    if (mime.includes('csv') || mime.includes('spreadsheet')) return <div className="p-1 min-w-[2rem] bg-green-500 rounded text-white text-[10px] flex items-center justify-center font-bold">CSV</div>;
    if (mime.startsWith('video/')) return <div className="p-1 min-w-[2rem] bg-purple-500 rounded text-white text-[10px] flex items-center justify-center font-bold">VID</div>;
    if (mime.startsWith('audio/')) return <div className="p-1 min-w-[2rem] bg-orange-500 rounded text-white text-[10px] flex items-center justify-center font-bold">AUD</div>;
    return <div className="p-1 min-w-[2rem] bg-gray-500 rounded text-white text-[10px] flex items-center justify-center font-bold">FILE</div>;
  };

  const getCardIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-primary" />;
    if (mime.includes('pdf')) return <div className="h-8 w-8 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">PDF</div>;
    if (mime.includes('word') || mime.includes('document')) return <div className="h-8 w-8 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">DOC</div>;
    if (mime.includes('csv') || mime.includes('spreadsheet')) return <div className="h-8 w-8 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">CSV</div>;
    if (mime.startsWith('video/')) return <div className="h-8 w-8 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">VID</div>;
    if (mime.startsWith('audio/')) return <div className="h-8 w-8 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">AUD</div>;
    return <div className="h-8 w-8 bg-gray-500 rounded text-white text-xs flex items-center justify-center font-bold">FILE</div>;
  };

  const getSortLabel = () => {
    const labels: Record<string, string> = { name: t('Name'), date: t('Date'), size: t('Size'), type: t('Type') };
    return `${labels[sortBy]} ${sortOrder === 'asc' ? '↑' : '↓'}`;
  };

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

  // Authenticated Layout Properties
  const breadcrumbs = [{ label: t('Dashboard'), url: route('dashboard') }, { label: t('Media Library') }];

  const pageActions = (
    <Button onClick={() => setIsUploadModalOpen(true)} className="shadow-sm">
      <Upload className="h-4 w-4 mr-2" />
      {t('Upload Files')}
    </Button>
  );

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs} pageTitle={t('Manage Media Library')} pageActions={pageActions}>
      <Head title={t('Media Library')} />

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* ── Left Sidebar (HRM Look) ── */}
        <div className="w-full lg:w-72 xl:w-80 lg:flex-shrink-0">
          <Card className="h-full lg:h-[calc(100vh-12rem)] flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">

              {/* Quick Access */}
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3">{t('Quick Access')}</h3>
                <Button
                  variant={currentDirectory === null ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start h-9 text-sm px-3"
                  onClick={() => setCurrentDirectory(null)}
                >
                  <Home className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                  <span className="truncate flex-1 text-left font-medium">{t('All Files')}</span>
                  <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20 min-w-[2rem] justify-center">
                    {allMedia.length}
                  </Badge>
                </Button>
              </div>

              {/* Folders */}
              <div className="p-4 border-b-0 lg:border-b flex-1 flex flex-col min-h-0 bg-card">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{t('Folders')}</h3>
                  <Button
                    variant="ghost" size="icon"
                    className="h-6 w-6 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                    onClick={() => { setShowCreateDirectory(true); setEditingDirectoryId(null); setNewDirectoryName(''); }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Inline Folder Creation */}
                {showCreateDirectory && (
                  <div className="mb-3 flex-shrink-0 space-y-2 bg-muted/30 p-2 rounded-md border border-dashed">
                    <Input
                      placeholder={t('Folder name...')}
                      value={newDirectoryName}
                      onChange={e => setNewDirectoryName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') createDirectory(); if (e.key === 'Escape') setShowCreateDirectory(false); }}
                      className="h-8 text-sm bg-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={createDirectory} size="sm" className="h-7 text-xs px-3 flex-1">{t('Create')}</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-3 flex-1" onClick={() => setShowCreateDirectory(false)}>{t('Cancel')}</Button>
                    </div>
                  </div>
                )}

                {/* Folder List */}
                <div className="space-y-1 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {directories.map(dir => {
                    const count = allMedia.filter(m => String(m.directory_id) === String(dir.id)).length;
                    const isEditing = editingDirectoryId === dir.id;
                    return (
                      <div key={dir.id} className="group">
                        {isEditing ? (
                          <div className="mb-1 bg-muted/30 p-2 rounded-md border border-dashed space-y-2">
                            <Input
                              value={editDirectoryName}
                              onChange={e => setEditDirectoryName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') updateDirectory(); if (e.key === 'Escape') setEditingDirectoryId(null); }}
                              className="h-8 text-sm bg-white"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button onClick={updateDirectory} size="sm" className="h-7 text-xs px-2 flex-1">{t('Save')}</Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs px-2 flex-1" onClick={() => setEditingDirectoryId(null)}>{t('Cancel')}</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <Button
                              variant={currentDirectory === dir.id ? 'secondary' : 'ghost'}
                              size="sm"
                              className="flex-1 justify-start h-9 text-sm px-3 min-w-0"
                              onClick={() => setCurrentDirectory(dir.id)}
                            >
                              {currentDirectory === dir.id
                                ? <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                                : <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />}
                              <span className="truncate flex-1 text-left font-medium">{dir.name}</span>
                              <Badge variant="outline" className="ml-2 bg-muted/50 min-w-[1.5rem] justify-center flex-shrink-0">{count}</Badge>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDirectoryId(dir.id);
                                  setEditDirectoryName(dir.name);
                                  setShowCreateDirectory(false);
                                }}>
                                  <Edit className="h-4 w-4 mr-2 text-muted-foreground" />{t('Edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDirectoryTarget(dir);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />{t('Delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {directories.length === 0 && !showCreateDirectory && (
                    <p className="text-xs text-muted-foreground text-center py-6">{t('No folders found')}</p>
                  )}
                </div>
              </div>

              {/* Storage Stats */}
              <div className="p-4 border-t flex-shrink-0 bg-muted/10 lg:mt-auto">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3">{t('Storage Usage')}</h3>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-row items-center justify-between gap-2">
                    <p className="text-sm text-foreground font-medium">{t('Used Space')}</p>
                    <p className="text-sm font-bold text-foreground">
                      {formatFileSize(allMedia.reduce((acc, i) => acc + i.size, 0))}
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── Right Content Area ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 h-full lg:h-[calc(100vh-12rem)]">

          {/* Top Filter Bar (Demo Look) */}
          <Card className="flex-shrink-0 border shadow-sm rounded-lg bg-card text-card-foreground">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">

                <div className='flex-1'>
                  {/* Search Section */}
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={t('Search media files...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 w-full rounded-md border border-input bg-background"
                    />
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 px-3 rounded-md rounded-r-none border-r-0 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 px-3 rounded-md rounded-l-none ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-3 rounded-md border border-input bg-background">
                        {getSortLabel()}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                        {t('Name')} (A-Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                        {t('Name')} (Z-A)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                        {t('Date')} ({t('Newest')})
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                        {t('Date')} ({t('Oldest')})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); }}>
                        {t('Size')} ({t('Largest')})
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('asc'); }}>
                        {t('Size')} ({t('Smallest')})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSortBy('type'); setSortOrder('asc'); }}>
                        {t('Type')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats Section */}
                <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">{filteredMedia.length} {t('Files')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <HardDrive className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">
                      {formatFileSize(filteredMedia.reduce((acc, item) => acc + item.size, 0))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">
                      {filteredMedia.filter(item => item.mime_type.startsWith('image/')).length} {t('Images')}
                    </span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Media Grid / List Area */}
          <Card className="flex-1 flex flex-col shadow-sm border-0 bg-primary/5 dark:bg-transparent rounded-xl overflow-hidden min-h-0">
            <CardContent className="p-4 lg:p-6 flex-1 relative min-h-0 overflow-hidden flex flex-col">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="animate-spin text-primary h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">{t('Loading media...')}</p>
                </div>
              ) : currentMedia.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-80">
                  <div className="h-24 w-24 bg-white dark:bg-gray-800 shadow-sm rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2">{t('No files found')}</h3>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    {searchTerm ? t('We could not find any files matching your search.') : t('This folder is empty. Drop files here or click the upload button to get started.')}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsUploadModalOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />{t('Upload Files')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="pb-0 flex-1 flex flex-col h-full">
                  {viewMode === 'grid' ? (
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-muted/30 transition-colors">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
                        {currentMedia.map(item => (
                          <div key={item.id} className="group flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div
                              className="aspect-[10/9] bg-muted/20 flex items-center justify-center cursor-pointer relative overflow-hidden"
                              onClick={() => handleShowInfo(item)}
                            >
                              {item.mime_type.startsWith('image/') ? (
                                <img src={item.thumb_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.currentTarget.src = item.url; }} />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  {getCardIcon(item.mime_type)}
                                  <span className="text-[10px] font-bold text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full backdrop-blur-sm border">{item.mime_type.split('/')[1]?.toUpperCase()}</span>
                                </div>
                              )}

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-200" />

                              <div className="absolute top-2 left-2">
                                <span className="inline-flex items-center rounded-md bg-gray-100/95 dark:bg-gray-800/95 px-2.5 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase shadow-sm backdrop-blur-md">
                                  {item.mime_type.split('/')[1] || 'FILE'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col flex-1 border-t border-border/50 bg-white dark:bg-card p-3">
                              <h4 className="text-sm font-semibold truncate text-foreground mb-2" title={item.name}>{item.name}</h4>
                              <div className="flex items-center justify-between mt-auto text-xs text-muted-foreground font-medium">
                                <span className="flex items-center">
                                  <HardDrive className="h-3 w-3 mr-1.5 opacity-60" />
                                  {formatFileSize(item.size)}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1.5 opacity-60" />
                                  {formatDate(item.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                      {/* Fixed Header Table */}
                      <div className="bg-muted/80 border-b border-border shadow-sm z-10 flex-shrink-0">
                        <table className="w-full text-left text-sm table-fixed">
                          <thead className="text-muted-foreground font-semibold">
                            <tr>
                              <th className="px-5 py-4 w-[45%]">{t('File Details')}</th>
                              <th className="px-5 py-4 w-[15%]">{t('Size')}</th>
                              <th className="px-5 py-4 w-[20%]">{t('Uploaded Date')}</th>
                              <th className="px-5 py-4 w-[20%] text-right">{t('Actions')}</th>
                            </tr>
                          </thead>
                        </table>
                      </div>

                      {/* Scrollable Body Table */}
                      <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted">
                        <table className="w-full text-left text-sm table-fixed">
                          <tbody className="divide-y divide-border">
                            {currentMedia.map(item => (
                              <tr key={item.id} className="hover:bg-muted/10 transition-colors cursor-default group">
                                <td className="px-5 py-3 w-[45%]">
                                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleShowInfo(item)}>
                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                                      {item.mime_type.startsWith('image/') ? <img src={item.thumb_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" onError={e => { e.currentTarget.src = item.url; }} /> : getFileIcon(item.mime_type)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-foreground truncate max-w-full">{item.name}</span>
                                      <span className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5 font-medium">{item.mime_type.split('/')[1] || 'FILE'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 w-[15%] text-muted-foreground">{formatFileSize(item.size)}</td>
                                <td className="px-5 py-3 w-[20%] text-muted-foreground">{formatDate(item.created_at)}</td>
                                <td className="px-5 py-3 w-[20%] text-right">
                                  <div className="flex justify-end gap-1">
                                    <TooltipProvider>
                                      <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50"
                                            onClick={() => {
                                              navigator.clipboard.writeText(item.url);
                                              toast.success(t('Link copied to clipboard'));
                                            }}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Copy Link')}</p></TooltipContent>
                                      </Tooltip>

                                      <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                            onClick={() => handleDownload(item.id, item.file_name)}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Download')}</p></TooltipContent>
                                      </Tooltip>

                                      <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                            onClick={() => handleShowInfo(item)}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('View Details')}</p></TooltipContent>
                                      </Tooltip>

                                      <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                            onClick={() => setDeleteFileTarget({ id: item.id, name: item.name })}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex mt-auto items-center justify-between pt-6">
                      <p className="text-sm text-muted-foreground">
                        {t('Showing')} {startIndex + 1} {t('to')} {Math.min(startIndex + itemsPerPage, filteredMedia.length)} {t('of')} {filteredMedia.length} {t('files')}
                      </p>

                      <nav className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                          className="h-9 px-3 rounded-md bg-background hover:bg-accent border-input shadow-sm"
                        >
                          {t('Previous')}
                        </Button>

                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 5) page = i + 1;
                          else if (currentPage <= 3) page = i + 1;
                          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                          else page = currentPage - 2 + i;

                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className={`rounded-md w-10 h-8 shadow-sm ${currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background hover:bg-accent'}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                          className="h-9 px-3 rounded-md bg-background hover:bg-accent border-input shadow-sm"
                        >
                          {t('Next')}
                        </Button>
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modals Area ── */}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('Upload Files')}
            </DialogTitle>
            <DialogDescription>
              {t('Upload new files to your media library')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${dragActive
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`transition-all duration-200 ${dragActive ? 'scale-110' : ''
                }`}>
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className={`h-8 w-8 transition-colors ${dragActive ? 'text-primary' : 'text-gray-400'
                    }`} />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {dragActive ? t('Drop files here') : t('Upload your files')}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('Drag and drop your files here, or click to browse')}
                </p>

                <Input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload-modal"
                />

                <Button
                  type="button"
                  onClick={() => document.getElementById('file-upload-modal')?.click()}
                  disabled={uploading}
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('Uploading...')}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('Choose Files')}
                    </>
                  )}
                </Button>
              </div>

              {dragActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <ConfirmationDialog
        open={!!deleteDirectoryTarget}
        onOpenChange={(open) => !open && setDeleteDirectoryTarget(null)}
        title={t('Delete Folder')}
        message={t('Are you sure you want to delete this folder?', { name: deleteDirectoryTarget?.name })}
        confirmText={t('Delete')}
        onConfirm={deleteDirectory}
        variant="destructive"
      />

      {/* Delete File Dialog */}
      <ConfirmationDialog
        open={!!deleteFileTarget}
        onOpenChange={(open) => !open && setDeleteFileTarget(null)}
        title={t('Delete Media')}
        message={t('Are you sure you want to delete this media?')}
        confirmText={t('Delete')}
        onConfirm={deleteMedia}
        variant="destructive"
      />

      {/* Info Modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-7xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('Media Details')}
            </DialogTitle>
            <DialogDescription>
              {t('View detailed information about this media')}
            </DialogDescription>
          </DialogHeader>

          {selectedMediaInfo && (
            <div className="flex flex-col md:flex-row gap-6 mt-2 h-auto md:h-[600px] xl:h-[650px]">
              {/* Left Side: Preview Area (70%) */}
              <div className="w-full md:w-[70%] h-[400px] md:h-full flex justify-center bg-gray-50 rounded-xl p-4 border border-border/50 items-center overflow-hidden">
                {selectedMediaInfo.mime_type.startsWith('image/') ? (
                  <img
                    src={selectedMediaInfo.url}
                    alt={selectedMediaInfo.name}
                    className="w-full h-full object-contain drop-shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = selectedMediaInfo.thumb_url;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full py-12">
                    <div className="mb-4 transform scale-150">
                      {getFileIcon(selectedMediaInfo.mime_type)}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground mt-4">
                      {selectedMediaInfo.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Details Area (30%) */}
              <div className="w-full md:w-[30%] h-full flex flex-col pt-2 justify-start overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-5">
                  {/* Info Section */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-5">{t('File Information')}</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">{t('File Name')}</span>
                        <span className="text-sm font-medium text-foreground break-all" title={selectedMediaInfo.file_name}>
                          {selectedMediaInfo.file_name}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">{t('Display Name')}</span>
                        <span className="text-sm font-medium text-foreground break-all" title={selectedMediaInfo.name}>
                          {selectedMediaInfo.name}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">{t('File Type')}</span>
                        <div className="flex items-start">
                          <span className="inline-block bg-muted/60 text-foreground text-xs px-3 py-1 rounded-full font-medium">
                            {selectedMediaInfo.mime_type}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">{t('File Size')}</span>
                        <span className="text-sm font-medium text-foreground">{formatFileSize(selectedMediaInfo.size)}</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-muted-foreground">{t('Upload Date')}</span>
                        <span className="text-sm font-medium text-foreground">{formatDate(selectedMediaInfo.created_at)}</span>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-sm text-muted-foreground">{t('File URL')}</span>
                        <div className="relative group mt-1">
                          <div className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs text-muted-foreground break-all leading-relaxed pr-10 font-mono">
                            {selectedMediaInfo.url}
                          </div>
                          <button
                            onClick={() => handleCopyLink(selectedMediaInfo.url)}
                            className="h-8 w-8 absolute top-2 right-2 flex items-center justify-center bg-transparent hover:bg-black/5 rounded-md transition-colors text-foreground"
                            title={t('Copy URL')}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">{t('Actions')}</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedMediaInfo.url, '_blank')}
                        className="flex-1 min-w-[90px] h-10 border border-border bg-[#f8f9fa] dark:bg-muted/30 hover:bg-muted text-sm shadow-sm"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                        {t('View')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(selectedMediaInfo.id, selectedMediaInfo.file_name)}
                        className="flex-1 min-w-[110px] h-10 border border-border bg-[#f8f9fa] dark:bg-muted/30 hover:bg-muted text-sm shadow-sm"
                      >
                        <Download className="h-4 w-4 text-green-600" />
                        {t('Download')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInfoModalOpen(false);
                          setTimeout(() => setDeleteFileTarget({ id: selectedMediaInfo.id, name: selectedMediaInfo.name }), 200);
                        }}
                        className="flex-[1_1_100%] 2xl:flex-1 min-w-[100px] h-10 border border-border bg-[#f8f9fa] dark:bg-muted/30 hover:bg-muted  text-sm shadow-sm"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        {t('Delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}