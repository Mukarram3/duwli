import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PhoneInputComponent } from '@/components/ui/phone-input';

import { EditAssetLocationProps, AssetLocationFormData } from './types';

export default function Edit({ assetLocation, onSuccess }: EditAssetLocationProps) {
    const { t } = useTranslation();
    const { activeLocations } = usePage<any>().props;
    const { data, setData, put, processing, errors } = useForm<AssetLocationFormData>({
        name: assetLocation.name ?? '',
        code: assetLocation.code ?? '',
        type: assetLocation.type ?? '',
        parent_id: assetLocation.parent_id ?? null,
        address: assetLocation.address ?? '',
        city: assetLocation.city ?? '',
        state: assetLocation.state ?? '',
        country: assetLocation.country ?? '',
        postal_code: assetLocation.postal_code ?? '',
        contact_person: assetLocation.contact_person ?? '',
        contact_phone: assetLocation.contact_phone ?? '',
        contact_email: assetLocation.contact_email ?? '',
        description: assetLocation.description ?? '',
        is_active: assetLocation.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('assets.asset-locations.update', assetLocation.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    const locationTypes = [
        { value: 'building', label: t('Building') },
        { value: 'floor', label: t('Floor') },
        { value: 'room', label: t('Room') },
        { value: 'warehouse', label: t('Warehouse') },
        { value: 'site', label: t('Site') },
    ];

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{t('Edit Location')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">{t('Name')}</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('Enter location name')}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="code">{t('Code')}</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder={t('Enter location code')}
                            required
                        />
                        <InputError message={errors.code} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="type" required>{t('Type')}</Label>
                        <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Type')} />
                            </SelectTrigger>
                            <SelectContent>
                                {locationTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    <div>
                        <Label htmlFor="parent_id">{t('Parent Location')}</Label>
                        <Select value={data.parent_id?.toString() || undefined} onValueChange={(value) => setData('parent_id', value ? parseInt(value) : null)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select parent location')} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeLocations?.filter((loc: any) => loc.id !== assetLocation.id).map((location: any) => (
                                    <SelectItem key={location.id} value={location.id.toString()}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.parent_id} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="address">{t('Address')}</Label>
                    <Textarea
                        id="address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        placeholder={t('Enter address')}
                    />
                    <InputError message={errors.address} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="city">{t('City')}</Label>
                        <Input
                            id="city"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            placeholder={t('Enter city')}
                        />
                        <InputError message={errors.city} />
                    </div>

                    <div>
                        <Label htmlFor="state">{t('State')}</Label>
                        <Input
                            id="state"
                            value={data.state}
                            onChange={(e) => setData('state', e.target.value)}
                            placeholder={t('Enter state')}
                        />
                        <InputError message={errors.state} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="country">{t('Country')}</Label>
                        <Input
                            id="country"
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                            placeholder={t('Enter country')}
                        />
                        <InputError message={errors.country} />
                    </div>

                    <div>
                        <Label htmlFor="postal_code">{t('Postal Code')}</Label>
                        <Input
                            id="postal_code"
                            value={data.postal_code}
                            onChange={(e) => setData('postal_code', e.target.value)}
                            placeholder={t('Enter postal code')}
                        />
                        <InputError message={errors.postal_code} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="contact_person">{t('Contact Person')}</Label>
                        <Input
                            id="contact_person"
                            value={data.contact_person}
                            onChange={(e) => setData('contact_person', e.target.value)}
                            placeholder={t('Enter contact person')}
                        />
                        <InputError message={errors.contact_person} />
                    </div>

                    <div>
                        <PhoneInputComponent
                            label={t('Contact Phone')}
                            value={data.contact_phone}
                            onChange={(value) => setData('contact_phone', value)}
                            placeholder="+1234567890"
                            error={errors.contact_phone}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="contact_email">{t('Contact Email')}</Label>
                    <Input
                        id="contact_email"
                        type="email"
                        value={data.contact_email}
                        onChange={(e) => setData('contact_email', e.target.value)}
                        placeholder={t('Enter contact email')}
                    />
                    <InputError message={errors.contact_email} />
                </div>

                <div>
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder={t('Enter description')}
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="is_active"
                        checked={data.is_active}
                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">{t('Active')}</Label>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onSuccess()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
