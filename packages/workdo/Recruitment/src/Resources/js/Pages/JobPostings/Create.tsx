import { useForm, usePage, router, Head } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagsInput } from '@/components/ui/tags-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent } from "@/components/ui/card";
import { CreateJobPostingProps, CreateJobPostingFormData } from './types';
import { useFormFields } from '@/hooks/useFormFields';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

export default function Create({ onSuccess }: CreateJobPostingProps) {
    const { jobtypes, joblocations, customquestions, branches } = usePage<any>().props;
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState(1);
    const [customQuestionsError, setCustomQuestionsError] = useState('');

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm<CreateJobPostingFormData>({
        title: '',
        position: '',
        priority: '0',
        job_application: 'existing',
        application_url: '',
        branch_id: '',
        applicant: [],
        visibility: [],
        min_experience: '',
        max_experience: '',
        min_salary: '',
        max_salary: '',
        description: '',
        requirements: '',
        benefits: '',
        terms_condition: '',
        show_terms_condition: false,
        application_deadline: '',
        is_published: false,
        publish_date: '',
        is_featured: false,
        status: '0',
        department_id: '',
        job_type_id: '',
        location_id: '',
        custom_questions: [],
        skills: [],
    });

    // AI hooks for job posting fields
    const titleAI = useFormFields('aiField', data, setData, errors, 'create', 'title', 'Title', 'recruitment', 'job_posting');

    const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
    const descriptionAI = useFormFields('aiField', data, (field, value) => {
        setData('description', value);
        setDescriptionEditorKey(prev => prev + 1);
    }, errors, 'create', 'description', 'Description', 'recruitment', 'job_posting');

    const [requirementsEditorKey, setRequirementsEditorKey] = useState(0);
    const requirementsAI = useFormFields('aiField', data, (field, value) => {
        setData('requirements', value);
        setRequirementsEditorKey(prev => prev + 1);
    }, errors, 'create', 'requirements', 'Requirements', 'recruitment', 'job_posting');

    const [benefitsEditorKey, setBenefitsEditorKey] = useState(0);
    const benefitsAI = useFormFields('aiField', data, (field, value) => {
        setData('benefits', value);
        setBenefitsEditorKey(prev => prev + 1);
    }, errors, 'create', 'benefits', 'Benefits', 'recruitment', 'job_posting');

    const [termsEditorKey, setTermsEditorKey] = useState(0);
    const termsAI = useFormFields('aiField', data, (field, value) => {
        setData('terms_condition', value);
        setTermsEditorKey(prev => prev + 1);
    }, errors, 'create', 'terms_condition', 'Terms Condition', 'recruitment', 'job_posting');

    const steps = [
        { number: 1, label: t('Basic Information') },
        { number: 2, label: t('Experience & Salary') },
        { number: 3, label: t('Job Details') },
    ];

    const validateStep1 = () => {
        let isValid = true;
        const requiredFields: (keyof CreateJobPostingFormData)[] = [
            'title', 'job_type_id', 'location_id', 'branch_id', 'job_application', 'position', 'priority', 'application_deadline'
        ];

        requiredFields.forEach(field => {
            if (!data[field]) {
                setError(field, t('This field is required'));
                isValid = false;
            } else {
                clearErrors(field);
            }
        });

        if (!data.skills || data.skills.length === 0) {
            setError('skills', t('Required Skills is required'));
            isValid = false;
        } else {
            clearErrors('skills');
        }

        if (data.job_application === 'custom' && !data.application_url) {
            setError('application_url', t('Application URL is required'));
            isValid = false;
        } else {
            clearErrors('application_url');
        }

        return isValid;
    };

    const validateStep2 = () => {
        let isValid = true;
        if (!data.min_experience) {
            setError('min_experience', t('Min Experience is required'));
            isValid = false;
        } else {
            clearErrors('min_experience');
        }
        return isValid;
    };

    const stepHasError = (stepNum: number) => {
        if (stepNum === 1) {
            const step1Fields = ['title', 'job_type_id', 'location_id', 'branch_id', 'priority', 'publish_date', 'application_deadline', 'job_application', 'application_url', 'position', 'skills'];
            return step1Fields.some(field => errors[field as keyof typeof errors]);
        }
        if (stepNum === 2) {
            const step2Fields = ['min_experience', 'max_experience', 'min_salary', 'max_salary'];
            return step2Fields.some(field => errors[field as keyof typeof errors]);
        }
        if (stepNum === 3) {
            const step3Fields = ['description', 'requirements', 'benefits', 'terms_condition', 'custom_questions', 'applicant', 'visibility'];
            return step3Fields.some(field => errors[field as keyof typeof errors]);
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCurrentStep(3);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleCancel = () => {
        if (onSuccess) {
            onSuccess();
        } else {
            router.get(route('recruitment.job-postings.index'));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required custom questions
        const requiredQuestions = customquestions?.filter((q: any) => q.is_required) || [];
        const missingRequired = requiredQuestions.filter((q: any) => !data.custom_questions.includes(q.id));

        if (missingRequired.length > 0) {
            setCustomQuestionsError(t('Please select all required custom questions'));
            return;
        }

        setCustomQuestionsError('');
        post(route('recruitment.job-postings.store'), {
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.get(route('recruitment.job-postings.index'));
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Job Postings'), url: route('recruitment.job-postings.index') },
                { label: t('Create') }
            ]}
            pageTitle={t('Create Job Posting')}
            pageDescription={t('Fill in the details below to create a new job posting.')}
            backUrl={route('recruitment.job-postings.index')}
        >
            <Head title={t('Create Job Posting')} />

            <div className="w-full">
                {/* Outer Card */}
                <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm overflow-visible bg-white dark:bg-zinc-950 p-6 md:p-8 space-y-6">
                    {/* Stepper Header (inside outer card, floating above inner card) */}
                    <div className="relative w-full px-4 mb-4">
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-5 ltr:left-0 rtl:right-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300 ease-in-out"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        <div className="flex items-center justify-between relative z-10">
                            {steps.map((step) => {
                                const isCompleted = currentStep > step.number;
                                const isActive = currentStep === step.number;
                                const hasError = stepHasError(step.number);
                                return (
                                    <div key={step.number} className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${hasError
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : isCompleted
                                                ? 'bg-primary border-primary text-white'
                                                : isActive
                                                    ? 'bg-white dark:bg-zinc-955 border-primary text-primary font-semibold shadow-sm'
                                                    : 'bg-gray-100 dark:bg-zinc-900 border-gray-300 dark:border-zinc-800 text-gray-400 dark:text-zinc-600'
                                            }`}>
                                            {isCompleted && !hasError ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <span>{step.number}</span>
                                            )}
                                        </div>
                                        <span className={`text-xs mt-2 font-semibold text-center max-w-[80px] md:max-w-none transition-colors duration-300 ${hasError
                                            ? 'text-red-500 dark:text-red-400'
                                            : isActive
                                                ? 'text-primary dark:text-primary/90'
                                                : isCompleted
                                                    ? 'text-primary/80 dark:text-primary/70'
                                                    : 'text-gray-500 dark:text-zinc-500'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Inner Form Card */}
                    <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm overflow-visible bg-white dark:bg-zinc-950">
                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {/* STEP 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                            {t('Basic Information')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1">
                                                        <Label htmlFor="title" required>{t('Job Title')}</Label>
                                                        <Input
                                                            id="title"
                                                            type="text"
                                                            value={data.title}
                                                            onChange={(e) => setData('title', e.target.value)}
                                                            placeholder={t('Enter Job Title')}
                                                            required
                                                        />
                                                        <InputError message={errors.title} />
                                                    </div>
                                                    {titleAI.map(field => <div key={field.id}>{field.component}</div>)}
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="job_type_id" required>{t('Job Type')}</Label>
                                                <Select
                                                    value={data.job_type_id?.toString() || ''}
                                                    onValueChange={(value) => setData('job_type_id', value)}
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Job Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {jobtypes?.map((item: any) => (
                                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                                {item.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {(!jobtypes || jobtypes.length === 0) && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('Create job type here. ')}
                                                        <a href={route('recruitment.job-types.index')} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                                            {t('job type')}
                                                        </a>.
                                                    </p>
                                                )}
                                                <InputError message={errors.job_type_id} />
                                            </div>

                                            <div>
                                                <Label htmlFor="location_id" required>{t('Location')}</Label>
                                                <Select
                                                    value={data.location_id?.toString() || ''}
                                                    onValueChange={(value) => setData('location_id', value)}
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Location')} />
                                                    </SelectTrigger>
                                                    <SelectContent searchable={true}>
                                                        {joblocations?.map((item: any) => (
                                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                                {item.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {(!joblocations || joblocations.length === 0) && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('Create job location here. ')}
                                                        <a href={route('recruitment.job-locations.index')} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                                            {t('job location')}
                                                        </a>.
                                                    </p>
                                                )}
                                                <InputError message={errors.location_id} />
                                            </div>

                                            <div>
                                                <Label htmlFor="branch_id" required>{t('Branch')}</Label>
                                                <Select value={data.branch_id?.toString() || ''} onValueChange={(value) => setData('branch_id', value)} required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Branch')} />
                                                    </SelectTrigger>
                                                    <SelectContent searchable={true}>
                                                        {branches?.map((branch: any) => (
                                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                {branch.branch_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.branch_id} />
                                                {(!branches || branches.length === 0) && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('Create branch here. ')}
                                                        <a href={route('hrm.branches.index')} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                                            {t('branch')}
                                                        </a>.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="priority" required className="mb-2 block">{t('Priority')}</Label>
                                                <div className="flex flex-row gap-2 w-fit">
                                                    {[
                                                        { value: '0', label: t('Low') },
                                                        { value: '1', label: t('Medium') },
                                                        { value: '2', label: t('High') }
                                                    ].map((item) => {
                                                        const isSelected = data.priority === item.value;
                                                        return (
                                                            <Button
                                                                key={item.value}
                                                                type="button"
                                                                size="sm"
                                                                variant={isSelected ? 'default' : 'outline'}
                                                                onClick={() => setData('priority', item.value)}
                                                                className={`transition-all duration-300 font-medium px-4 h-8 ${isSelected
                                                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border-primary'
                                                                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 bg-transparent'
                                                                    }`}
                                                            >
                                                                {item.label}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={errors.priority} />
                                            </div>

                                            <div>
                                                <Label required>{t('Start Date')}</Label>
                                                <DatePicker
                                                    value={data.publish_date}
                                                    onChange={(date) => setData('publish_date', date)}
                                                    placeholder={t('Select Start Date')}
                                                    required
                                                />
                                                <InputError message={errors.publish_date} />
                                            </div>

                                            <div>
                                                <Label required>{t('Application Deadline')}</Label>
                                                <DatePicker
                                                    value={data.application_deadline}
                                                    onChange={(date) => setData('application_deadline', date)}
                                                    placeholder={t('Select Application Deadline')}
                                                    minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                                                    required
                                                />
                                                <InputError message={errors.application_deadline} />
                                            </div>

                                            <div>
                                                <Label htmlFor="job_application" required>{t('Job Application')}</Label>
                                                <Select value={data.job_application || ''} onValueChange={(value) => setData('job_application', value)} required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('Select Application Type')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="existing">{t('Use Existing System')}</SelectItem>
                                                        <SelectItem value="custom">{t('Custom Application URL')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.job_application} />
                                            </div>

                                            {data.job_application === 'existing' ? (
                                                <div>
                                                    <Label>{t('Career Portal URL')}</Label>
                                                    <Input
                                                        value={route('recruitment.frontend.careers.jobs.index', { userSlug: usePage<any>().props.auth?.user?.slug || 'demo' })}
                                                        readOnly
                                                        className="bg-gray-50 dark:bg-zinc-900 border-dashed"
                                                    />
                                                </div>
                                            ) : data.job_application === 'custom' ? (
                                                <div>
                                                    <Label htmlFor="application_url" required>{t('Application URL')}</Label>
                                                    <Input
                                                        id="application_url"
                                                        type="url"
                                                        value={data.application_url}
                                                        onChange={(e) => setData('application_url', e.target.value)}
                                                        placeholder={t('Enter Application URL')}
                                                        required
                                                    />
                                                    <InputError message={errors.application_url} />
                                                </div>
                                            ) : (
                                                <div />
                                            )}

                                            <div>
                                                <Label htmlFor="position" required>{t('Number of Positions')}</Label>
                                                <Input
                                                    id="position"
                                                    type="number"
                                                    min="1"
                                                    value={data.position}
                                                    onChange={(e) => setData('position', e.target.value)}
                                                    placeholder={t('Enter Number of Positions')}
                                                    required
                                                />
                                                <InputError message={errors.position} />
                                            </div>

                                            <div>
                                                <Label htmlFor="skills" required>{t('Required Skills')}</Label>
                                                <TagsInput
                                                    value={data.skills}
                                                    onChange={(skills) => setData('skills', skills)}
                                                    placeholder={t('Add skills and press Enter...')}
                                                    allowCustom={true}
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('Type Required Skills and press Enter')}
                                                </p>
                                                <InputError message={errors.skills} />
                                            </div>

                                            <div className="flex items-center space-x-2.5 pt-6">
                                                <Switch
                                                    id="is_featured"
                                                    checked={data.is_featured || false}
                                                    onCheckedChange={(checked) => setData('is_featured', checked)}
                                                />
                                                <Label htmlFor="is_featured" className="cursor-pointer font-medium">{t('Featured Job')}</Label>
                                                <InputError message={errors.is_featured} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Experience & Salary */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                            {t('Experience & Salary')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Label htmlFor="min_experience" required>{t('Min Experience (Years)')}</Label>
                                                <Input
                                                    id="min_experience"
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    value={data.min_experience}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setData('min_experience', value);
                                                        if (data.max_experience && parseFloat(data.max_experience) < parseFloat(value)) {
                                                            setData('max_experience', '');
                                                        }
                                                    }}
                                                    placeholder={t('Enter Minimum Experience')}
                                                    required
                                                />
                                                <InputError message={errors.min_experience} />
                                            </div>

                                            <div>
                                                <Label htmlFor="max_experience">{t('Max Experience (Years)')}</Label>
                                                <Input
                                                    id="max_experience"
                                                    type="number"
                                                    step="0.5"
                                                    min={data.min_experience || "0"}
                                                    value={data.max_experience}
                                                    onChange={(e) => setData('max_experience', e.target.value)}
                                                    placeholder={t('Enter Maximum Experience')}
                                                />
                                                <InputError message={errors.max_experience} />
                                                {data.min_experience && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('Must be greater than or equal to minimum experience')} ({data.min_experience})
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <CurrencyInput
                                                    label={t('Min Salary')}
                                                    value={data.min_salary}
                                                    onChange={(value) => {
                                                        setData('min_salary', value);
                                                        if (data.max_salary && parseFloat(data.max_salary) < parseFloat(value)) {
                                                            setData('max_salary', '');
                                                        }
                                                    }}
                                                    error={errors.min_salary}
                                                />
                                            </div>

                                            <div>
                                                <CurrencyInput
                                                    label={t('Max Salary')}
                                                    value={data.max_salary}
                                                    onChange={(value) => setData('max_salary', value)}
                                                    error={errors.max_salary}
                                                    min={data.min_salary || "0"}
                                                />
                                                {data.min_salary && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {t('Must be greater than or equal to minimum salary')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Job Details */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                            {t('Job Details')}
                                        </h3>

                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label htmlFor="description" required>{t('Job Description')}</Label>
                                                    <div className="flex gap-2">
                                                        {descriptionAI.map(field => <div key={field.id}>{field.component}</div>)}
                                                    </div>
                                                </div>
                                                <div className="[&_.tiptap]:max-h-[200px] [&_.tiptap]:overflow-y-auto [&_.tiptap]:min-h-[150px]">
                                                    <RichTextEditor
                                                        key={`description-editor-${descriptionEditorKey}`}
                                                        content={data.description}
                                                        onChange={(content) => setData('description', content)}
                                                        placeholder={t('Enter Description')}
                                                    />
                                                </div>
                                                <InputError message={errors.description} />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label htmlFor="requirements" required>{t('Requirements')}</Label>
                                                    <div className="flex gap-2">
                                                        {requirementsAI.map(field => <div key={field.id}>{field.component}</div>)}
                                                    </div>
                                                </div>
                                                <div className="[&_.tiptap]:max-h-[200px] [&_.tiptap]:overflow-y-auto [&_.tiptap]:min-h-[150px]">
                                                    <RichTextEditor
                                                        key={`requirements-editor-${requirementsEditorKey}`}
                                                        content={data.requirements}
                                                        onChange={(content) => setData('requirements', content)}
                                                        placeholder={t('Enter Requirements')}
                                                    />
                                                </div>
                                                <InputError message={errors.requirements} />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label htmlFor="benefits" required>{t('Benefits')}</Label>
                                                    <div className="flex gap-2">
                                                        {benefitsAI.map(field => <div key={field.id}>{field.component}</div>)}
                                                    </div>
                                                </div>
                                                <div className="[&_.tiptap]:max-h-[200px] [&_.tiptap]:overflow-y-auto [&_.tiptap]:min-h-[150px]">
                                                    <RichTextEditor
                                                        key={`benefits-editor-${benefitsEditorKey}`}
                                                        content={data.benefits}
                                                        onChange={(content) => setData('benefits', content)}
                                                        placeholder={t('Enter Benefits')}
                                                    />
                                                </div>
                                                <InputError message={errors.benefits} />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label htmlFor="terms_condition" required>{t('Terms Condition')}</Label>
                                                    <div className="flex gap-2">
                                                        {termsAI.map(field => <div key={field.id}>{field.component}</div>)}
                                                    </div>
                                                </div>
                                                <div className="[&_.tiptap]:max-h-[200px] [&_.tiptap]:overflow-y-auto [&_.tiptap]:min-h-[150px]">
                                                    <RichTextEditor
                                                        key={`terms-editor-${termsEditorKey}`}
                                                        content={data.terms_condition}
                                                        onChange={(content) => setData('terms_condition', content)}
                                                        placeholder={t('Enter Terms Condition')}
                                                    />
                                                </div>
                                                <InputError message={errors.terms_condition} />
                                                <div className="flex items-center space-x-2 mt-3">
                                                    <Checkbox
                                                        id="show_terms_condition"
                                                        checked={data.show_terms_condition || false}
                                                        onCheckedChange={(checked) => setData('show_terms_condition', !!checked)}
                                                    />
                                                    <Label htmlFor="show_terms_condition" className="cursor-pointer font-medium">{t('Show Terms & Conditions on Application Form')}</Label>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                                                <Label className="text-base font-semibold block mb-3">{t('Application Questions')}</Label>
                                                <div className="space-y-3">
                                                    {customquestions?.map((question: any) => (
                                                        <div key={question.id} className="flex items-start space-x-2.5">
                                                            <Checkbox
                                                                id={`question_${question.id}`}
                                                                checked={data.custom_questions.includes(question.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('custom_questions', [...data.custom_questions, question.id]);
                                                                    } else {
                                                                        setData('custom_questions', data.custom_questions.filter(id => id !== question.id));
                                                                    }
                                                                    setCustomQuestionsError('');
                                                                }}
                                                                className="mt-0.5"
                                                            />
                                                            <Label htmlFor={`question_${question.id}`} className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">
                                                                {question.question}
                                                                {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                                <InputError message={errors.custom_questions || customQuestionsError} />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 dark:border-zinc-800 pt-6">
                                                <div className="bg-gray-50/50 dark:bg-zinc-900/40 rounded-xl p-5 border border-gray-100 dark:border-zinc-800/80">
                                                    <Label className="text-sm font-bold block mb-4">{t('Need to Ask?')}</Label>
                                                    <div className="space-y-3.5">
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="applicant_gender"
                                                                checked={data.applicant.includes('gender')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('applicant', [...data.applicant, 'gender']);
                                                                    } else {
                                                                        setData('applicant', data.applicant.filter(item => item !== 'gender'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="applicant_gender" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Gender')}</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="applicant_date_of_birth"
                                                                checked={data.applicant.includes('date_of_birth')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('applicant', [...data.applicant, 'date_of_birth']);
                                                                    } else {
                                                                        setData('applicant', data.applicant.filter(item => item !== 'date_of_birth'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="applicant_date_of_birth" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Date Of Birth')}</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="applicant_country"
                                                                checked={data.applicant.includes('country')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('applicant', [...data.applicant, 'country']);
                                                                    } else {
                                                                        setData('applicant', data.applicant.filter(item => item !== 'country'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="applicant_country" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Country')}</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50/50 dark:bg-zinc-900/40 rounded-xl p-5 border border-gray-100 dark:border-zinc-800/80">
                                                    <Label className="text-sm font-bold block mb-4">{t('Need to Show Option?')}</Label>
                                                    <div className="space-y-3.5">
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="visibility_profile_image"
                                                                checked={data.visibility.includes('profile_image')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('visibility', [...data.visibility, 'profile_image']);
                                                                    } else {
                                                                        setData('visibility', data.visibility.filter(item => item !== 'profile_image'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="visibility_profile_image" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Profile Image')}</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="visibility_resume"
                                                                checked={data.visibility.includes('resume')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('visibility', [...data.visibility, 'resume']);
                                                                    } else {
                                                                        setData('visibility', data.visibility.filter(item => item !== 'resume'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="visibility_resume" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Resume')}</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2.5">
                                                            <Checkbox
                                                                id="visibility_cover_letter"
                                                                checked={data.visibility.includes('cover_letter')}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('visibility', [...data.visibility, 'cover_letter']);
                                                                    } else {
                                                                        setData('visibility', data.visibility.filter(item => item !== 'cover_letter'));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor="visibility_cover_letter" className="cursor-pointer font-medium text-sm text-gray-700 dark:text-zinc-300">{t('Cover Letter')}</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center border-t border-gray-100 dark:border-zinc-800 pt-6">
                                    <div>
                                        {currentStep > 1 ? (
                                            <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                                                <ArrowLeft className="h-4 w-4" />
                                                {t('Back')}
                                            </Button>
                                        ) : (
                                            <Button type="button" variant="outline" onClick={handleCancel}>
                                                {t('Cancel')}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {currentStep < 3 ? (
                                            <Button type="button" onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                                                {t('Next')}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <>
                                                <Button type="button" variant="outline" onClick={handleCancel}>
                                                    {t('Cancel')}
                                                </Button>
                                                <Button type="submit" disabled={processing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                                    {processing ? t('Creating...') : t('Create')}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
