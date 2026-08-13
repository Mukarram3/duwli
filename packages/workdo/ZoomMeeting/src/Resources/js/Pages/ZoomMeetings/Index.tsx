import { useState, useRef, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
    Plus, Edit as EditIcon, Trash2, Eye, Video as VideoIcon, Play, 
    ExternalLink, Calendar as CalendarIcon, Clock, CheckCircle, 
    XCircle, ChevronLeft, ChevronRight, MoreVertical, X 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import EditZoomMeeting from './Edit';
import Show from './Show';
import { ZoomMeeting, ZoomMeetingsIndexProps, ZoomMeetingModalState } from './types';
import { getImagePath, formatTime } from '@/utils/helpers';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Index() {
    const { t } = useTranslation();
    const { zoommeetings, auth, users, adminAllSetting, companyAllSetting } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.roles?.includes('superadmin');
    const globalSettings = isSuperAdmin ? adminAllSetting : (companyAllSetting || adminAllSetting);
    const isRTL = globalSettings?.layoutDirection === 'rtl';

    const [modalState, setModalState] = useState<ZoomMeetingModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showModal, setShowModal] = useState<{isOpen: boolean; data: ZoomMeeting | null}>({
        isOpen: false,
        data: null
    });

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
    const [calendarTitle, setCalendarTitle] = useState('');
    const [currentViewStart, setCurrentViewStart] = useState<Date | null>(null);
    const calendarRef = useRef<FullCalendar>(null);

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlMonth = params ? params.get('month') : null;
    const initialDateStr = urlMonth ? `${urlMonth}-01` : undefined;

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'zoommeeting.zoom-meetings.destroy',
        defaultMessage: t('Are you sure you want to delete this zoommeeting?')
    });

    const updateStatus = (meetingId: number, newStatus: string) => {
        router.patch(route('zoommeeting.zoom-meetings.update-status', meetingId), {
            status: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Status updated successfully
            }
        });
    };

    const openModal = (mode: 'add' | 'edit', data: ZoomMeeting | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const meetings = zoommeetings?.data || [];

    const pageProps = usePage().props;



    // Stats calculations from current page data (filtered by currently viewed month)
    const stats = useMemo(() => {
        const viewStart = currentViewStart || new Date();
        const viewYear = viewStart.getFullYear();
        const viewMonth = viewStart.getMonth();

        const currentMonthMeetings = meetings.filter(m => {
            if (!m.start_time) return false;
            const mDate = new Date(m.start_time);
            return mDate.getFullYear() === viewYear && mDate.getMonth() === viewMonth;
        });

        return {
            upcoming: currentMonthMeetings.filter(m => m.status === 'Scheduled').length,
            live: currentMonthMeetings.filter(m => m.status === 'Started').length,
            completed: currentMonthMeetings.filter(m => m.status === 'Ended').length,
            cancelled: currentMonthMeetings.filter(m => m.status === 'Cancelled').length
        };
    }, [meetings, currentViewStart]);

    // Format meetings into FullCalendar event items
    const calendarEvents = useMemo(() => {
        return meetings.map(meeting => {
            const start = new Date(meeting.start_time);
            const end = new Date(start.getTime() + (meeting.duration || 0) * 60 * 1000);
            
            return {
                id: meeting.id.toString(),
                title: meeting.title,
                start: meeting.start_time,
                end: end.toISOString(),
                extendedProps: meeting
            };
        });
    }, [meetings]);

    const scrollTime = useMemo(() => {
        const currentHour = new Date().getHours();
        const startHour = currentHour > 2 ? currentHour - 2 : 0;
        return `${String(startHour).padStart(2, '0')}:00:00`;
    }, []);

    const isSameDay = (d1: Date, d2Str: string) => {
        if (!d2Str) return false;
        const d2 = new Date(d2Str);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    // Filtered list of meetings on the selected day, sorted chronologically
    const selectedDayMeetings = useMemo(() => {
        return meetings
            .filter(meeting => isSameDay(selectedDate, meeting.start_time))
            .sort((a, b) => {
                const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
                const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
                return timeA - timeB;
            });
    }, [meetings, selectedDate]);

    const formatSelectedDate = (date: Date) => {
        return date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getMeetingTimeRange = (meeting: ZoomMeeting) => {
        if (!meeting.start_time) return '';
        const start = new Date(meeting.start_time);
        const end = new Date(start.getTime() + (meeting.duration || 0) * 60 * 1000);
        return `${formatTime(start.toTimeString().split(' ')[0], pageProps)} - ${formatTime(end.toTimeString().split(' ')[0], pageProps)}`;
    };

    // Calendar Navigation Functions
    const handlePrev = () => {
        calendarRef.current?.getApi().prev();
    };

    const handleNext = () => {
        calendarRef.current?.getApi().next();
    };

    const handleToday = () => {
        calendarRef.current?.getApi().today();
        setSelectedDate(new Date());
    };

    const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
        setCalendarView(view);
        calendarRef.current?.getApi().changeView(view);
    };

    const handleMonthChange = (date: Date) => {
        if (typeof window === 'undefined') return;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const formattedMonth = `${year}-${month}`;

        const params = new URLSearchParams(window.location.search);
        const currentMonthInUrl = params.get('month');
        const today = new Date();
        const currentSystemMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        if (!currentMonthInUrl && formattedMonth === currentSystemMonth) {
            return;
        }

        if (currentMonthInUrl !== formattedMonth) {
            router.get(route('zoommeeting.zoom-meetings.index'), {
                month: formattedMonth
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }
    };

    const handleEventClick = (info: any) => {
        const meeting = info.event.extendedProps;
        if (meeting.start_time) {
            setSelectedDate(new Date(meeting.start_time));
        }
    };

    const handleDateClick = (info: any) => {
        setSelectedDate(new Date(info.dateStr));
    };

    // Custom Event content renderer for FullCalendar
    const renderEventContent = (eventInfo: any) => {
        const status = eventInfo.event.extendedProps.status;
        const startTimeStr = eventInfo.event.extendedProps.start_time;
        const timeFormatted = startTimeStr ? formatTime(new Date(startTimeStr).toTimeString().split(' ')[0], pageProps) : '';

        const colors = {
            Scheduled: { bg: 'bg-amber-50/80 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-900/20', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
            Started: { bg: 'bg-emerald-50/80 hover:bg-emerald-100/50 dark:bg-emerald-950/10 dark:hover:bg-emerald-900/20', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
            Ended: { bg: 'bg-purple-50/80 hover:bg-purple-100/50 dark:bg-purple-950/10 dark:hover:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-300', dot: 'bg-purple-500' },
            Cancelled: { bg: 'bg-rose-50/80 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-900/20', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' }
        };

        const style = colors[status as keyof typeof colors] || colors.Scheduled;
        const isMonthView = eventInfo.view.type === 'dayGridMonth';

        if (isMonthView) {
            return (
                <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-border/50 ${style.bg} ${style.text} w-full overflow-hidden shadow-sm hover:scale-[1.01] transition-transform duration-200`}>
                    <span className="font-semibold text-[11px] shrink-0 opacity-80">{timeFormatted}</span>
                    <span className="truncate text-[11.5px] font-normal leading-tight">{eventInfo.event.title}</span>
                </div>
            );
        }

        return (
            <div className={`flex flex-col gap-0.5 px-2 py-1 rounded border border-border ${style.bg} ${style.text} w-full overflow-hidden shadow-sm hover:scale-[1.02] transition-transform duration-200`}>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-medium text-[11.5px] shrink-0 opacity-80">{timeFormatted}</span>
                </div>
                <div className="truncate font-normal text-[12.5px] leading-tight">
                    {eventInfo.event.title}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Zoom Meetings')}
            ]}
            pageTitle={t('Zoom Meetings')}
            pageActions={
                auth.user?.permissions?.includes('create-zoom-meetings') && (
                    <Button size="sm" onClick={() => openModal('add')} className="gap-1.5 font-bold">
                        <Plus className="h-4 w-4" />
                        {t('Schedule Meeting')}
                    </Button>
                )
            }
        >
            <Head title={t('Zoom Meetings')} />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Scheduled Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Scheduled')}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-blue-800 dark:text-blue-200">{stats.upcoming}</h3>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Meetings')}</p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-80" />
                    </CardContent>
                </Card>

                {/* Started Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Started')}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">{stats.live}</h3>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">{t('Meetings')}</p>
                        </div>
                        <VideoIcon className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </CardContent>
                </Card>

                {/* Ended Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:border-purple-800/50 hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">{t('Ended')}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-purple-800 dark:text-purple-200">{stats.completed}</h3>
                            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">{t('Meetings')}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-700 dark:text-purple-300 opacity-80" />
                    </CardContent>
                </Card>

                {/* Cancelled Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('Cancelled')}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-rose-800 dark:text-rose-200">{stats.cancelled}</h3>
                            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">{t('Meetings')}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-80" />
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side: Calendar (75%) */}
                <Card className="flex-1 p-6 shadow-sm min-w-0 bg-card text-card-foreground lg:h-[780px] flex flex-col">
                    {/* Custom Calendar Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-6">
                        {/* Views Selector */}
                        <div className="flex items-center bg-muted p-1 rounded-lg w-fit md:justify-self-start">
                            <Button
                                variant={calendarView === 'dayGridMonth' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleViewChange('dayGridMonth')}
                                className="h-8 text-xs font-medium px-3 py-1.5"
                            >
                                {t('Month')}
                            </Button>
                            <Button
                                variant={calendarView === 'timeGridWeek' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleViewChange('timeGridWeek')}
                                className="h-8 text-xs font-medium px-3 py-1.5"
                            >
                                {t('Week')}
                            </Button>
                            <Button
                                variant={calendarView === 'timeGridDay' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handleViewChange('timeGridDay')}
                                className="h-8 text-xs font-medium px-3 py-1.5"
                            >
                                {t('Day')}
                            </Button>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center gap-3 md:justify-self-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrev}
                                className="h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <h2 className="text-lg font-bold min-w-[140px] text-center">
                                {calendarTitle}
                            </h2>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNext}
                                className="h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToday}
                                className="h-8 px-3 text-xs"
                            >
                                {t('Today')}
                            </Button>
                        </div>

                        {/* Status Legend */}
                        <div className="flex items-center gap-4 flex-wrap md:justify-self-end text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span>{t('Scheduled')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>{t('Started')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                <span>{t('Ended')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span>{t('Cancelled')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Calendar grid */}
                    <div className={`
                        fullcalendar-container
                        [&_.fc]:font-sans [&_.fc]:border-none [&_.fc]:bg-transparent
                        [&_.fc-scrollgrid]:border [&_.fc-scrollgrid]:border-border [&_.fc-scrollgrid]:rounded-xl [&_.fc-scrollgrid]:overflow-hidden [&_.fc-scrollgrid]:shadow-sm
                        [&_.fc-theme-standard_td]:border [&_.fc-theme-standard_td]:border-border [&_.fc-theme-standard_th]:border [&_.fc-theme-standard_th]:border-border
                        [&_.fc-col-header-cell]:bg-muted/15 [&_.fc-col-header-cell]:font-normal [&_.fc-col-header-cell]:uppercase [&_.fc-col-header-cell]:tracking-wider [&_.fc-col-header-cell]:text-muted-foreground [&_.fc-col-header-cell]:py-2.5 [&_.fc-col-header-cell]:text-[11px] [&_.fc-col-header-cell]:border-b [&_.fc-col-header-cell]:border-border
                        [&_.fc-daygrid-day]:cursor-pointer [&_.fc-daygrid-day]:transition-colors [&_.fc-daygrid-day]:duration-150
                        hover:[&_.fc-daygrid-day]:bg-muted/40
                        [&_.fc-daygrid-day-frame]:overflow-hidden [&_.fc-daygrid-day-frame]:h-full
                        [&_.fc-daygrid-row]:h-[105px] [&_.fc-daygrid-day]:h-[105px]
                        [&_.fc-scroller]:overflow-hidden
                        [&_.fc-view-dayGridMonth_.fc-scroller]:!overflow-hidden
                        [&_.fc-day-today]:bg-primary/[0.02]
                        [&_.fc-day-today_.fc-daygrid-day-number]:bg-primary [&_.fc-day-today_.fc-daygrid-day-number]:text-primary-foreground [&_.fc-day-today_.fc-daygrid-day-number]:rounded-full [&_.fc-day-today_.fc-daygrid-day-number]:inline-flex [&_.fc-day-today_.fc-daygrid-day-number]:items-center [&_.fc-day-today_.fc-daygrid-day-number]:justify-center [&_.fc-day-today_.fc-daygrid-day-number]:w-6 [&_.fc-day-today_.fc-daygrid-day-number]:h-6 [&_.fc-day-today_.fc-daygrid-day-number]:m-1 [&_.fc-day-today_.fc-daygrid-day-number]:p-0 [&_.fc-day-today_.fc-daygrid-day-number]:font-semibold [&_.fc-day-today_.fc-daygrid-day-number]:shadow-sm
                        [&_.fc-day-today_.fc-daygrid-day-top]:flex [&_.fc-day-today_.fc-daygrid-day-top]:justify-end
                        [&_.fc-daygrid-day-number]:text-foreground [&_.fc-daygrid-day-number]:font-normal [&_.fc-daygrid-day-number]:p-1.5 [&_.fc-daygrid-day-number]:text-[13px] [&_.fc-daygrid-day-number]:transition-all [&_.fc-daygrid-day-number]:duration-200
                        [&_.selected-day-cell]:!bg-primary/[0.08] [&_.selected-day-cell:hover]:!bg-primary/[0.12] [&_.selected-day-cell]:z-10
                        [&_.fc-event]:bg-transparent [&_.fc-event]:border-none [&_.fc-event]:m-0.5 [&_.fc-event]:p-0
                        [&_.fc-daygrid-event-harness]:mb-0.5
                        [&_.fc-timegrid-now-indicator-line]:bg-[#ea4335]
                        [&_.fc-timegrid-now-indicator-line]:h-[2px]
                        [&_.fc-timegrid-now-indicator-line]:!z-30
                        [&_.fc-timegrid-now-indicator-line]:border-none
                        [&_.fc-timegrid-now-indicator-line]:overflow-visible
                        [&_.fc-timegrid-now-indicator-line]:before:content-['']
                        [&_.fc-timegrid-now-indicator-line]:before:absolute
                        [&_.fc-timegrid-now-indicator-line]:before:w-2.5
                        [&_.fc-timegrid-now-indicator-line]:before:h-2.5
                        [&_.fc-timegrid-now-indicator-line]:before:bg-[#ea4335]
                        [&_.fc-timegrid-now-indicator-line]:before:rounded-full
                        [&_.fc-timegrid-now-indicator-line]:before:top-1/2
                        [&_.fc-timegrid-now-indicator-line]:before:-translate-y-1/2
                        [&_.fc-timegrid-now-indicator-line]:before:left-0
                        [&_.fc-timegrid-now-indicator-line]:before:-translate-x-1/2
                        rtl:[&_.fc-timegrid-now-indicator-line]:before:left-auto
                        rtl:[&_.fc-timegrid-now-indicator-line]:before:right-0
                        rtl:[&_.fc-timegrid-now-indicator-line]:before:translate-x-1/2

                        [&_.fc-now-indicator-line]:bg-[#ea4335]
                        [&_.fc-now-indicator-line]:h-[2px]
                        [&_.fc-now-indicator-line]:!z-30
                        [&_.fc-now-indicator-line]:border-none
                        [&_.fc-now-indicator-line]:overflow-visible
                        [&_.fc-now-indicator-line]:before:content-['']
                        [&_.fc-now-indicator-line]:before:absolute
                        [&_.fc-now-indicator-line]:before:w-2.5
                        [&_.fc-now-indicator-line]:before:h-2.5
                        [&_.fc-now-indicator-line]:before:bg-[#ea4335]
                        [&_.fc-now-indicator-line]:before:rounded-full
                        [&_.fc-now-indicator-line]:before:top-1/2
                        [&_.fc-now-indicator-line]:before:-translate-y-1/2
                        [&_.fc-now-indicator-line]:before:left-0
                        [&_.fc-now-indicator-line]:before:-translate-x-1/2
                        rtl:[&_.fc-now-indicator-line]:before:left-auto
                        rtl:[&_.fc-now-indicator-line]:before:right-0
                        rtl:[&_.fc-now-indicator-line]:before:translate-x-1/2

                        [&_.fc-timegrid-now-indicator-arrow]:!hidden
                        [&_.fc-now-indicator-arrow]:!hidden
                        dark:[&_.fc-theme-standard_td]:border-border/40 dark:[&_.fc-theme-standard_th]:border-border/40 dark:[&_.fc-scrollgrid]:border-border/40
                        [&_.fc-popover]:bg-card [&_.fc-popover]:border [&_.fc-popover]:border-border [&_.fc-popover]:rounded-xl [&_.fc-popover]:shadow-lg [&_.fc-popover]:z-50 [&_.fc-popover]:overflow-hidden
                        [&_.fc-popover-header]:bg-muted/30 [&_.fc-popover-header]:px-3.5 [&_.fc-popover-header]:py-2.5 [&_.fc-popover-header]:border-b [&_.fc-popover-header]:border-border [&_.fc-popover-header]:flex [&_.fc-popover-header]:items-center [&_.fc-popover-header]:justify-between
                        [&_.fc-popover-title]:text-[13px] [&_.fc-popover-title]:font-semibold [&_.fc-popover-title]:text-foreground [&_.fc-popover-title]:m-0
                        [&_.fc-popover-close]:text-muted-foreground [&_.fc-popover-close]:opacity-70 hover:[&_.fc-popover-close]:opacity-100 [&_.fc-popover-close]:transition-opacity [&_.fc-popover-close]:text-base
                        [&_.fc-popover-body]:p-3 [&_.fc-popover-body]:bg-card [&_.fc-popover-body]:flex [&_.fc-popover-body]:flex-col [&_.fc-popover-body]:gap-2 [&_.fc-popover-body]:max-h-[250px] [&_.fc-popover-body]:overflow-y-auto
                        max-md:[&_.fc-daygrid-row]:h-[75px] max-md:[&_.fc-daygrid-day]:h-[75px]
                        max-md:[&_.fc-col-header-cell]:text-[9.5px] max-md:[&_.fc-col-header-cell]:py-1.5
                        max-md:[&_.fc-daygrid-day-number]:text-[10px] max-md:[&_.fc-daygrid-day-number]:p-1
                        max-md:[&_.fc-popover]:w-[92%] max-md:[&_.fc-popover]:left-[4%]
                    `}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            direction={isRTL ? 'rtl' : 'ltr'}
                            initialView="dayGridMonth"
                            initialDate={initialDateStr}
                            headerToolbar={false}
                            events={calendarEvents}
                            height={calendarView === 'dayGridMonth' ? 'auto' : 650}
                            nowIndicator={true}
                            scrollTime={scrollTime}
                            slotLabelContent={(args) => {
                                const date = args.date;
                                const hour = date.getHours();
                                const minutes = date.getMinutes();
                                const is12Hour = globalSettings?.timeFormat === 'g:i A';
                                
                                if (is12Hour) {
                                    const ampm = hour >= 12 ? 'PM' : 'AM';
                                    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                                    const displayMinutes = minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : '';
                                    return `${displayHour}${displayMinutes} ${ampm}`;
                                } else {
                                    const displayHour = String(hour).padStart(2, '0');
                                    const displayMinutes = String(minutes).padStart(2, '0');
                                    return `${displayHour}:${displayMinutes}`;
                                }
                            }}
                            eventContent={renderEventContent}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            dayCellClassNames={(arg) => {
                                const isSelected = arg.date.getFullYear() === selectedDate.getFullYear() &&
                                                   arg.date.getMonth() === selectedDate.getMonth() &&
                                                   arg.date.getDate() === selectedDate.getDate();
                                return isSelected ? 'selected-day-cell' : '';
                            }}
                            datesSet={(info) => {
                                setCalendarTitle(info.view.title);
                                setCurrentViewStart(info.view.currentStart);
                                handleMonthChange(info.view.currentStart);
                            }}
                            dayMaxEvents={2}
                            moreLinkText={t('more')}
                            allDayText={t('All day')}
                            eventMaxStack={3}
                            eventDisplay="block"
                        />
                    </div>
                </Card>

                {/* Right Side: Selected Day Meetings (25%) */}
                <Card className="w-full lg:w-[380px] p-6 shadow-sm flex flex-col bg-card text-card-foreground lg:h-[780px]">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-bold text-sm">
                                {formatSelectedDate(selectedDate)}
                            </h3>
                        </div>
                    </div>

                    {/* Scrollable meetings list */}
                    <div className="flex-1 overflow-y-auto space-y-4 pe-1">
                        {selectedDayMeetings.length > 0 ? (
                            selectedDayMeetings.map((meeting) => (
                                <div 
                                    key={meeting.id} 
                                    className="p-4 rounded-xl border border-border bg-card/50 hover:shadow-sm hover:border-muted-foreground/30 transition-all space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {getMeetingTimeRange(meeting)}
                                        </span>
                                        {(() => {
                                            const statusMap = {
                                                Scheduled: { 
                                                    label: t('Scheduled'), 
                                                    color: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-500/20' 
                                                },
                                                Started: { 
                                                    label: t('Started'), 
                                                    color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-500/20' 
                                                },
                                                Ended: { 
                                                    label: t('Ended'), 
                                                    color: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/20 dark:text-purple-300 dark:ring-purple-500/20' 
                                                },
                                                Cancelled: { 
                                                    label: t('Cancelled'), 
                                                    color: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-500/20' 
                                                }
                                            };
                                            const s = statusMap[meeting.status as keyof typeof statusMap] || { 
                                                label: meeting.status, 
                                                color: 'bg-gray-50 text-gray-700 ring-gray-600/20' 
                                            };
                                            return (
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${s.color}`}>
                                                    {s.label}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm tracking-tight">{meeting.title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{meeting.description || '-'}</p>
                                    </div>

                                    {/* Host & Participants */}
                                    <div className="flex items-center justify-between border-t pt-3 mt-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <img
                                                src={getImagePath(meeting.host?.avatar || '')}
                                                alt={meeting.host?.name || 'Host'}
                                                className="w-7 h-7 rounded-full object-cover border border-border"
                                            />
                                            <span className="text-[13px] font-medium text-muted-foreground truncate max-w-[120px]">
                                                {meeting.host?.name || '-'}
                                            </span>
                                        </div>

                                        {/* Participants list */}
                                        {(() => {
                                            let pList = [];
                                            if (typeof meeting.participants === 'string') {
                                                try { pList = JSON.parse(meeting.participants); } catch { pList = [meeting.participants]; }
                                            } else if (Array.isArray(meeting.participants)) {
                                                pList = meeting.participants;
                                            }
                                            if (pList.length === 0) return null;
                                            const modelData = users || [];
                                            return (
                                                <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                                                    <TooltipProvider>
                                                        {pList.slice(0, 3).map((pId: any, idx: number) => {
                                                            const uItem = modelData.find((m: any) => m.id.toString() === pId?.toString());
                                                            const name = uItem?.name || pId;
                                                            return (
                                                                 <Tooltip key={idx} delayDuration={0}>
                                                                     <TooltipTrigger asChild>
                                                                         <img
                                                                             src={getImagePath(uItem?.avatar || '')}
                                                                             alt={name}
                                                                             className="w-6 h-6 rounded-full object-cover border border-card hover:scale-110 hover:z-10 transition-transform cursor-pointer"
                                                                         />
                                                                     </TooltipTrigger>
                                                                     <TooltipContent>
                                                                         <p className="text-xs">{name}</p>
                                                                     </TooltipContent>
                                                                 </Tooltip>
                                                            );
                                                        })}
                                                    </TooltipProvider>
                                                    {pList.length > 3 && (
                                                         <div className="w-6 h-6 rounded-full bg-muted border border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                             +{pList.length - 3}
                                                         </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Action Buttons in card */}
                                    <div className="flex items-center gap-2 pt-2 border-t mt-2 justify-between">
                                        <div className="flex items-center gap-1.5">
                                            {meeting.meeting_id && ['Scheduled', 'Started'].includes(meeting.status) && (
                                                <>
                                                    {auth.user?.permissions?.includes('join-zoom-meetings') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => window.open(meeting.join_url || `https://zoom.us/j/${meeting.meeting_id}`, '_blank')}
                                                            className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30"
                                                            title={t('Join')}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {auth.user?.permissions?.includes('start-zoom-meetings') && (meeting.host_id === auth.user?.id || auth.user?.type === 'company') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => window.open(meeting.start_url || `https://zoom.us/s/${meeting.meeting_id}`, '_blank')}
                                                            className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30"
                                                            title={t('Start')}
                                                        >
                                                            <Play className="h-4 w-4 fill-current" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Dropdown Menu for Edit/Delete/Change Status */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                {auth.user?.permissions?.includes('view-zoom-meetings') && (
                                                    <DropdownMenuItem onClick={() => setShowModal({isOpen: true, data: meeting})}>
                                                        <Eye className="h-4 w-4 me-2" />
                                                        {t('View')}
                                                    </DropdownMenuItem>
                                                )}
                                                {auth.user?.permissions?.includes('edit-zoom-meetings') && meeting.status === 'Scheduled' && (
                                                    <DropdownMenuItem onClick={() => openModal('edit', meeting)}>
                                                        <EditIcon className="h-4 w-4 me-2" />
                                                        {t('Edit')}
                                                    </DropdownMenuItem>
                                                )}
                                                {auth.user?.permissions?.includes('update-zoom-meeting-status') && (
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Clock className="h-4 w-4 me-2" />
                                                            {t('Change Status')}
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem onClick={() => updateStatus(meeting.id, 'Scheduled')}>
                                                                {t('Scheduled')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateStatus(meeting.id, 'Started')}>
                                                                {t('Started')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateStatus(meeting.id, 'Ended')}>
                                                                {t('Ended')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateStatus(meeting.id, 'Cancelled')}>
                                                                {t('Cancelled')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                )}
                                                {auth.user?.permissions?.includes('delete-zoom-meetings') && (
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        onClick={() => openDeleteDialog(meeting.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 me-2" />
                                                        {t('Delete')}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-xl p-4">
                                <VideoIcon className="h-8 w-8 mb-2 opacity-40" />
                                <p className="text-xs font-semibold">{t('No meetings scheduled')}</p>
                                <p className="text-[11px] mt-0.5">{t('Try selecting another date.')}</p>
                            </div>
                        )}
                    </div>

                </Card>
            </div>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditZoomMeeting
                        zoommeeting={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete ZoomMeeting')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            {showModal.data && (
                <Show
                    isOpen={showModal.isOpen}
                    onClose={() => setShowModal({isOpen: false, data: null})}
                    zoommeeting={showModal.data}
                    users={users}
                />
            )}


        </AuthenticatedLayout>
    );
}