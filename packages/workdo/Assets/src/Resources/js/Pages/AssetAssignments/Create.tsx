import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import InputError from "@/components/ui/input-error";
import { useFormFields } from '@/hooks/useFormFields';
import { CreateAssetAssignmentProps, CreateAssetAssignmentFormData, Asset, User } from './types';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Create({ onSuccess }: CreateAssetAssignmentProps) {
    const { t } = useTranslation();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const { data, setData, post, processing, errors } = useForm<CreateAssetAssignmentFormData>({
        asset_id: '',
        user_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        condition_on_assignment: 'excellent',
        assignment_notes: '',
    });

    const formFields = useFormFields('assetAssignment', data, setData, errors);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetsResponse, usersResponse] = await Promise.all([
                    axios.get(route('assets.asset-assignments.available-assets')),
                    axios.get(route('assets.asset-assignments.users'))
                ]);
                setAssets(assetsResponse.data);
                setUsers(usersResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('assets.asset-assignments.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    if (loading) {
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Create Assignment')}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">{t('Loading...')}</p>
                    </div>
                </div>
            </DialogContent>
        );
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('Create Assignment')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="asset_id" required>{t('Asset')}</Label>
                    <Select value={data.asset_id.toString()} onValueChange={(value) => setData('asset_id', parseInt(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select asset')} />
                        </SelectTrigger>
                        <SelectContent>
                            {assets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                    {asset.name} ({asset.serial_code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.asset_id} />
                </div>

                <div>
                    <Label htmlFor="user_id" required>{t('Assign To')}</Label>
                    <Select value={data.user_id.toString()} onValueChange={(value) => setData('user_id', parseInt(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select user')} />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name} ({user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.user_id} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label required>{t('Assigned Date')}</Label>
                        <DatePicker
                            value={data.assigned_date}
                            onChange={(date) => setData('assigned_date', date)}
                            placeholder={t('Select Assigned Date')}
                        />
                        <InputError message={errors.assigned_date} />
                    </div>
                    <div>
                        <Label>{t('Expected Return Date')}</Label>
                        <DatePicker
                            value={data.expected_return_date}
                            onChange={(date) => setData('expected_return_date', date)}
                            placeholder={t('Select Date')}
                        />
                        <InputError message={errors.expected_return_date} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="condition_on_assignment" required>{t('Condition on Assignment')}</Label>
                    <Select value={data.condition_on_assignment} onValueChange={(value) => setData('condition_on_assignment', value as any)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="excellent">{t('Excellent')}</SelectItem>
                            <SelectItem value="good">{t('Good')}</SelectItem>
                            <SelectItem value="fair">{t('Fair')}</SelectItem>
                            <SelectItem value="poor">{t('Poor')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.condition_on_assignment} />
                </div>

                <div>
                    <Label htmlFor="assignment_notes">{t('Assignment Notes')}</Label>
                    <Textarea
                        id="assignment_notes"
                        value={data.assignment_notes}
                        onChange={(e) => setData('assignment_notes', e.target.value)}
                        placeholder={t('Enter any notes about this assignment')}
                        rows={3}
                    />
                    <InputError message={errors.assignment_notes} />
                </div>

                {formFields.map((field) => (
                    <div key={field.id}>{field.component}</div>
                ))}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Creating...') : t('Create')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
