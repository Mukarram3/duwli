import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import InputError from '@/components/ui/input-error';
import { isPackageActive, getCompanySetting } from '@/utils/helpers';

export const createCalendarSyncField = (data: any, setData: any, errors: any) => {
    if (!isPackageActive('Calendar')) {
        return [];
    }

    // Check if Google Calendar is enabled in settings
    const googleCalendarEnabled = getCompanySetting('google_calendar_enable');
    if (googleCalendarEnabled !== 'on') {
        return [];
    }

    // Check if Google Calendar is configured
    const googleCalendarId = getCompanySetting('google_calendar_id');
    const googleCalendarJson = getCompanySetting('google_calendar_json_file');
    if (!googleCalendarId || !googleCalendarJson) {
        return [];
    }

    const { t } = useTranslation();

    return [{
        id: 'calendar-sync',
        order: 100,
        component: (
            <div className="flex items-center space-x-2">
                <Switch
                    id="sync_to_google_calendar"
                    checked={data.sync_to_google_calendar || false}
                    onCheckedChange={(checked) => setData('sync_to_google_calendar', !!checked)}
                />
                <Label htmlFor="sync_to_google_calendar" className="cursor-pointer">{t('Sync to Google Calendar')}</Label>
                <InputError message={errors.sync_to_google_calendar} />
            </div>
        )
    }];
};

export const getCalendarSyncFields = (data: any, setData: any, errors: any) => {
    return createCalendarSyncField(data, setData, errors);
};