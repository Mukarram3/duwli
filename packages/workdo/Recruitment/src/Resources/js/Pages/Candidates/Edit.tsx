import { useForm, usePage, router, Head } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { EditCandidateProps, EditCandidateFormData } from './types';
import { getImagePath } from '@/utils/helpers';

export default function EditCandidate({ candidate, onSuccess }: EditCandidateProps) {
    const { jobpostings, candidatesources } = usePage<any>().props;
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [customQuestions, setCustomQuestions] = useState([]);
    const [jobPostingSettings, setJobPostingSettings] = useState<{ applicant: string[], visibility: string[] }>({ applicant: [], visibility: [] });
    const [customErrors, setCustomErrors] = useState<{ [key: string]: string }>({});
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [resumePreview, setResumePreview] = useState<string | null>(null);
    const [coverLetterPreview, setCoverLetterPreview] = useState<string | null>(null);

    const steps = [
        { number: 1, label: t('Job & Source') },
        { number: 2, label: t('Personal Information') },
        { number: 3, label: t('Professional Info & Questions') },
    ];

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            return <Image className="h-8 w-8 text-blue-500" />;
        }
        return <FileText className="h-8 w-8 text-red-500" />;
    };

    const handleFileChange = (file: File | null, type: 'profile_photo' | 'resume' | 'cover_letter') => {
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (type === 'profile_photo') {
                        setProfilePreview(e.target?.result as string);
                    } else if (type === 'resume') {
                        setResumePreview(e.target?.result as string);
                    } else {
                        setCoverLetterPreview(e.target?.result as string);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                if (type === 'profile_photo') {
                    setProfilePreview(null);
                } else if (type === 'resume') {
                    setResumePreview(null);
                } else {
                    setCoverLetterPreview(null);
                }
            }
        } else {
            if (type === 'profile_photo') {
                setProfilePreview(null);
            } else if (type === 'resume') {
                setResumePreview(null);
            } else {
                setCoverLetterPreview(null);
            }
        }
        setData(type, file);
    };

    // Initialize form data with existing custom question answers
    const getInitialFormData = () => {
        const baseData = {
            job_id: candidate.job_id?.toString() || '',
            source_id: candidate.source_id?.toString() || '',
            first_name: candidate.first_name ?? '',
            last_name: candidate.last_name ?? '',
            email: candidate.email ?? '',
            phone: candidate.phone ?? '',
            gender: candidate.gender || 'male',
            dob: candidate.dob ?
                (typeof candidate.dob === 'string' ?
                    candidate.dob.split('T')[0] :
                    new Date(candidate.dob).toISOString().split('T')[0]) : '',
            country: candidate.country ?? '',
            state: candidate.state ?? '',
            city: candidate.city ?? '',
            current_company: candidate.current_company ?? '',
            current_position: candidate.current_position ?? '',
            experience_years: candidate.experience_years ?? '',
            current_salary: candidate.current_salary ?? '',
            expected_salary: candidate.expected_salary ?? '',
            notice_period: candidate.notice_period ?? '',
            skills: candidate.skills ?? '',
            education: candidate.education ?? '',
            portfolio_url: candidate.portfolio_url ?? '',
            linkedin_url: candidate.linkedin_url ?? '',
            profile_url: candidate.profile_path ?? '',
            resume: null,
            cover_letter: null,
            status: candidate.status?.toString() || '0',
            application_date: candidate.application_date ?
                (typeof candidate.application_date === 'string' ?
                    candidate.application_date.split('T')[0] :
                    new Date(candidate.application_date).toISOString().split('T')[0]) : '',
            custom_question: candidate.custom_question ?? '',
        };

        // Add existing custom question answers
        if (candidate.custom_question) {
            try {
                const existingAnswers = JSON.parse(candidate.custom_question);
                Object.keys(existingAnswers).forEach(key => {
                    baseData[key] = existingAnswers[key];
                });
            } catch (e) {
            }
        }

        return baseData;
    };

    const { data, setData, put, processing, errors, setError, clearErrors } = useForm<any>(getInitialFormData());

    // Load custom questions on mount
    useEffect(() => {
        if (candidate.job_id) {
            axios.get(route('recruitment.job-postings.custom-questions', candidate.job_id))
                .then(response => {
                    setCustomQuestions(response.data);
                })
                .catch(() => {
                    setCustomQuestions([]);
                });

            axios.get(route('recruitment.job-postings.settings', candidate.job_id))
                .then(response => {
                    setJobPostingSettings({
                        applicant: response.data.applicant || [],
                        visibility: response.data.visibility || []
                    });
                })
                .catch(() => {
                    setJobPostingSettings({ applicant: [], visibility: [] });
                });
        }
    }, []);

    // Handle job change
    useEffect(() => {
        if (data.job_id && data.job_id !== candidate.job_id?.toString()) {
            axios.get(route('recruitment.job-postings.custom-questions', data.job_id))
                .then(response => {
                    setCustomQuestions(response.data);
                    // Clear existing custom question answers when job changes
                    const newData = { ...data };
                    Object.keys(newData).forEach(key => {
                        if (key.startsWith('custom_question_')) {
                            delete newData[key];
                        }
                    });
                    setData(newData);
                })
                .catch(() => {
                    setCustomQuestions([]);
                });

            axios.get(route('recruitment.job-postings.settings', data.job_id))
                .then(response => {
                    setJobPostingSettings({
                        applicant: response.data.applicant || [],
                        visibility: response.data.visibility || []
                    });
                })
                .catch(() => {
                    setJobPostingSettings({ applicant: [], visibility: [] });
                });
        }
    }, [data.job_id]);

    const validateStep1 = () => {
        let isValid = true;
        const requiredFields: string[] = [
            'job_id', 'source_id', 'application_date'
        ];

        requiredFields.forEach(field => {
            if (!data[field]) {
                setError(field, t('This field is required'));
                isValid = false;
            } else {
                clearErrors(field);
            }
        });

        return isValid;
    };

    const validateStep2 = () => {
        let isValid = true;
        const requiredFields: string[] = [
            'first_name', 'last_name', 'email', 'phone'
        ];

        requiredFields.forEach(field => {
            if (!data[field]) {
                setError(field, t('This field is required'));
                isValid = false;
            } else {
                clearErrors(field);
            }
        });

        // Conditionally required Job Specific fields
        if (jobPostingSettings.applicant.includes('gender') && !data.gender) {
            setError('gender', t('This field is required'));
            isValid = false;
        } else { clearErrors('gender'); }

        if (jobPostingSettings.applicant.includes('date_of_birth') && !data.dob) {
            setError('dob', t('This field is required'));
            isValid = false;
        } else { clearErrors('dob'); }

        if (jobPostingSettings.applicant.includes('country')) {
            if (!data.country) { setError('country', t('This field is required')); isValid = false; } else { clearErrors('country'); }
            if (!data.state) { setError('state', t('This field is required')); isValid = false; } else { clearErrors('state'); }
            if (!data.city) { setError('city', t('This field is required')); isValid = false; } else { clearErrors('city'); }
        }

        if (jobPostingSettings.visibility.includes('profile_image') && !data.profile_url) {
            setError('profile_photo', t('This field is required'));
            isValid = false;
        } else { clearErrors('profile_photo'); }

        return isValid;
    };

    const validateStep3 = () => {
        let isValid = true;
        const requiredFields: string[] = [
            'current_company', 'current_position', 'experience_years',
            'current_salary', 'expected_salary', 'skills', 'education'
        ];

        requiredFields.forEach(field => {
            if (!data[field] && data[field] !== 0) {
                setError(field, t('This field is required'));
                isValid = false;
            } else {
                clearErrors(field);
            }
        });

        if (jobPostingSettings.visibility.includes('resume') && !data.resume && !candidate.resume_path) {
            setError('resume', t('This field is required'));
            isValid = false;
        } else {
            clearErrors('resume');
        }

        if (jobPostingSettings.visibility.includes('cover_letter') && !data.cover_letter && !candidate.cover_letter_path) {
            setError('cover_letter', t('This field is required'));
            isValid = false;
        } else {
            clearErrors('cover_letter');
        }

        return isValid;
    };

    const stepHasError = (stepNum: number) => {
        if (stepNum === 1) {
            const step1Fields = ['job_id', 'source_id', 'application_date'];
            return step1Fields.some(field => errors[field as keyof typeof errors]);
        }
        if (stepNum === 2) {
            const step2Fields = ['first_name', 'last_name', 'email', 'phone', 'gender', 'dob', 'country', 'state', 'city', 'profile_photo'];
            return step2Fields.some(field => errors[field as keyof typeof errors]);
        }
        if (stepNum === 3) {
            const step3Fields = ['current_company', 'current_position', 'experience_years', 'current_salary', 'expected_salary', 'notice_period', 'skills', 'education', 'portfolio_url', 'linkedin_url', 'resume', 'cover_letter'];
            const customQuestionKeys = Object.keys(errors).filter(key => key.startsWith('custom_question_'));
            return step3Fields.some(field => errors[field as keyof typeof errors]) || customQuestionKeys.length > 0 || Object.keys(customErrors).length > 0;
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCustomErrors({});
                clearErrors();
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCustomErrors({});
                clearErrors();
                setCurrentStep(3);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleStepClick = (targetStep: number) => {
        if (targetStep < currentStep) {
            setCurrentStep(targetStep);
            return;
        }

        if (targetStep === 2) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        } else if (targetStep === 3) {
            if (validateStep1() && validateStep2()) {
                setCurrentStep(3);
            }
        }
    };

    const handleCancel = () => {
        if (onSuccess) {
            onSuccess();
        } else {
            router.get(route('recruitment.candidates.index'));
        }
    };

    const handleSubmit = () => {
        if (!validateStep3()) {
            return;
        }

        // Validate required custom questions
        const requiredQuestions = customQuestions.filter((q: any) => q.is_required);
        const newErrors: { [key: string]: string } = {};

        requiredQuestions.forEach((q: any) => {
            const answer = data[`custom_question_${q.id}`];
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
                newErrors[`custom_question_${q.id}`] = t('This field is required.');
            }
        });

        setCustomErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        put(route('recruitment.candidates.update', candidate.id), {
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.get(route('recruitment.candidates.index'));
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Candidates'), url: route('recruitment.candidates.index') },
                { label: t('Edit') }
            ]}
            pageTitle={t('Edit Candidate')}
            pageDescription={t('Modify the details below to update the candidate profile.')}
            backUrl={route('recruitment.candidates.index')}
        >
            <Head title={t('Edit Candidate')} />

            <div className="w-full">
                {/* Main Wizard Card */}
                <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955 p-6 md:p-8 space-y-8">
                    {/* Stepper Header Container */}
                    <div className="relative w-full px-4 pb-6 border-b border-gray-300 dark:border-zinc-700">
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
                                    <button
                                        key={step.number}
                                        type="button"
                                        onClick={() => handleStepClick(step.number)}
                                        className="flex flex-col items-center focus:outline-none group relative z-10"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-105 ${hasError
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : isCompleted
                                                ? 'bg-primary border-primary text-white'
                                                : isActive
                                                    ? 'bg-white dark:bg-zinc-950 border-primary text-primary font-semibold shadow-sm'
                                                    : 'bg-gray-100 dark:bg-zinc-900 border-gray-300 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 group-hover:border-primary/50'
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
                                                    : 'text-gray-500 dark:text-zinc-500 group-hover:text-primary/75'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {currentStep === 1 && (
                            <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                    <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                        {t('Job & Source Selection')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="job_id" required>{t('Job')} </Label>
                                            <Select value={data.job_id?.toString() || ''} onValueChange={(value) => setData('job_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Job')} />
                                                </SelectTrigger>
                                                <SelectContent searchable={true}>
                                                    {jobpostings.map((item: any) => (
                                                        <SelectItem key={item.id} value={item.id.toString()}>
                                                            {item.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.job_id} />
                                            {(!jobpostings || jobpostings.length === 0) && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('Create job posting here. ')}
                                                    <a
                                                        href={route('recruitment.job-postings.index')}
                                                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {t('job posting')}
                                                    </a>.
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="source_id" required>{t('Source')} </Label>
                                            <Select
                                                value={data.source_id?.toString() || ''}
                                                onValueChange={(value) => setData('source_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Source')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {candidatesources?.map((item: any) => (
                                                        <SelectItem key={item.id} value={item.id.toString()}>
                                                            {item.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.source_id} />
                                            {(!candidatesources || candidatesources.length === 0) && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('Create candidate source here. ')}
                                                    <a
                                                        href={route('recruitment.candidate-sources.index')}
                                                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        {t('candidate source')}
                                                    </a>.
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label required>{t('Application Date')}</Label>
                                            <DatePicker
                                                value={data.application_date}
                                                onChange={(date) => setData('application_date', date)}
                                                placeholder={t('Select Application Date')}
                                            />
                                            <InputError message={errors.application_date} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                    <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                        <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                            {t('Personal Information')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Label htmlFor="first_name" required>{t('First Name')}</Label>
                                                <Input
                                                    id="first_name"
                                                    type="text"
                                                    value={data.first_name}
                                                    onChange={(e) => setData('first_name', e.target.value)}
                                                    placeholder={t('Enter First Name')}
                                                />
                                                <InputError message={errors.first_name} />
                                            </div>

                                            <div>
                                                <Label htmlFor="last_name" required>{t('Last Name')}</Label>
                                                <Input
                                                    id="last_name"
                                                    type="text"
                                                    value={data.last_name}
                                                    onChange={(e) => setData('last_name', e.target.value)}
                                                    placeholder={t('Enter Last Name')}
                                                />
                                                <InputError message={errors.last_name} />
                                            </div>

                                            <div>
                                                <Label htmlFor="email" required>{t('Email')}</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder={t('Enter Email')}
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div>
                                                <PhoneInputComponent
                                                    label={t('Phone')}
                                                    value={data.phone}
                                                    onChange={(value) => setData('phone', value)}
                                                    placeholder={t('Enter Phone')}
                                                    error={errors.phone}
                                                    id="phone"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {(jobPostingSettings.applicant.includes('gender') ||
                                    jobPostingSettings.applicant.includes('date_of_birth') ||
                                    jobPostingSettings.applicant.includes('country') ||
                                    jobPostingSettings.visibility.includes('profile_image')) && (
                                        <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                            <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                                <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                                    {t('Job Specific Information')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {jobPostingSettings.applicant.includes('gender') && (
                                                        <div>
                                                            <Label htmlFor="gender" required className="mb-2 block">{t('Gender')}</Label>
                                                            <div className="flex flex-row gap-2 w-fit">
                                                                {[
                                                                    { value: 'male', label: t('Male') },
                                                                    { value: 'female', label: t('Female') },
                                                                    { value: 'other', label: t('Other') }
                                                                ].map((item) => {
                                                                    const isSelected = data.gender === item.value;
                                                                    return (
                                                                        <Button
                                                                            key={item.value}
                                                                            type="button"
                                                                            size="sm"
                                                                            variant={isSelected ? 'default' : 'outline'}
                                                                            onClick={() => setData('gender', item.value)}
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
                                                            <InputError message={errors.gender} />
                                                        </div>
                                                    )}

                                                    {jobPostingSettings.applicant.includes('date_of_birth') && (
                                                        <div>
                                                            <Label required>{t('Date of Birth')}</Label>
                                                            <DatePicker
                                                                value={data.dob}
                                                                onChange={(date) => setData('dob', date)}
                                                                placeholder={t('Select Date of Birth')}
                                                                maxDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
                                                            />
                                                            <InputError message={errors.dob} />
                                                        </div>
                                                    )}

                                                    {jobPostingSettings.applicant.includes('country') && (
                                                        <div>
                                                            <Label htmlFor="country" required>{t('Country')}</Label>
                                                            <Input
                                                                id="country"
                                                                type="text"
                                                                value={data.country}
                                                                onChange={(e) => setData('country', e.target.value)}
                                                                placeholder={t('Enter Country')}
                                                            />
                                                            <InputError message={errors.country} />
                                                        </div>
                                                    )}

                                                    {jobPostingSettings.applicant.includes('country') && (
                                                        <>
                                                            <div>
                                                                <Label htmlFor="state" required>{t('State')}</Label>
                                                                <Input
                                                                    id="state"
                                                                    type="text"
                                                                    value={data.state}
                                                                    onChange={(e) => setData('state', e.target.value)}
                                                                    placeholder={t('Enter State')}
                                                                />
                                                                <InputError message={errors.state} />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="city" required>{t('City')}</Label>
                                                                <Input
                                                                    id="city"
                                                                    type="text"
                                                                    value={data.city}
                                                                    onChange={(e) => setData('city', e.target.value)}
                                                                    placeholder={t('Enter City')}
                                                                />
                                                                <InputError message={errors.city} />
                                                            </div>
                                                        </>
                                                    )}

                                                    {jobPostingSettings.visibility.includes('profile_image') && (
                                                        <div className="md:col-span-2">
                                                            <MediaPicker
                                                                label={t('Profile Photo')}
                                                                value={data.profile_url}
                                                                onChange={(value) => setData('profile_url', value as string)}
                                                                placeholder={t('Select Profile Photo')}
                                                                id="profile_photo"
                                                                required
                                                            />
                                                            <InputError message={errors.profile_photo} />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                    <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                        <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                            {t('Professional Details')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Label htmlFor="current_company" required>{t('Current Company')}</Label>
                                                <Input
                                                    id="current_company"
                                                    type="text"
                                                    value={data.current_company}
                                                    onChange={(e) => setData('current_company', e.target.value)}
                                                    placeholder={t('Enter Current Company')}
                                                />
                                                <InputError message={errors.current_company} />
                                            </div>

                                            <div>
                                                <Label htmlFor="current_position" required>{t('Current Position')}</Label>
                                                <Input
                                                    id="current_position"
                                                    type="text"
                                                    value={data.current_position}
                                                    onChange={(e) => setData('current_position', e.target.value)}
                                                    placeholder={t('Enter Current Position')}
                                                />
                                                <InputError message={errors.current_position} />
                                            </div>

                                            <div>
                                                <Label htmlFor="experience_years" required>{t('Experience (Years)')}</Label>
                                                <Input
                                                    id="experience_years"
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    value={data.experience_years}
                                                    onChange={(e) => setData('experience_years', e.target.value)}
                                                    placeholder={t('Enter Experience in Years')}
                                                />
                                                <InputError message={errors.experience_years} />
                                            </div>

                                            <div>
                                                <CurrencyInput
                                                    label={t('Current Salary')}
                                                    value={data.current_salary}
                                                    onChange={(value) => setData('current_salary', value)}
                                                    error={errors.current_salary}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <CurrencyInput
                                                    label={t('Expected Salary')}
                                                    value={data.expected_salary}
                                                    onChange={(value) => setData('expected_salary', value)}
                                                    error={errors.expected_salary}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="notice_period">{t('Notice Period')}</Label>
                                                <Input
                                                    id="notice_period"
                                                    type="text"
                                                    value={data.notice_period}
                                                    onChange={(e) => setData('notice_period', e.target.value)}
                                                    placeholder={t('Enter Notice Period')}
                                                />
                                                <InputError message={errors.notice_period} />
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label htmlFor="skills" required>{t('Skills')}</Label>
                                                <Textarea
                                                    id="skills"
                                                    value={data.skills}
                                                    onChange={(e) => setData('skills', e.target.value)}
                                                    placeholder={t('Enter Skills')}
                                                    rows={3}
                                                />
                                                <InputError message={errors.skills} />
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label htmlFor="education" required>{t('Education')}</Label>
                                                <Textarea
                                                    id="education"
                                                    value={data.education}
                                                    onChange={(e) => setData('education', e.target.value)}
                                                    placeholder={t('Enter Education')}
                                                    rows={3}
                                                />
                                                <InputError message={errors.education} />
                                            </div>

                                            <div>
                                                <Label htmlFor="portfolio_url">{t('Portfolio Url')}</Label>
                                                <Input
                                                    id="portfolio_url"
                                                    type="text"
                                                    value={data.portfolio_url}
                                                    onChange={(e) => setData('portfolio_url', e.target.value)}
                                                    placeholder={t('Enter Portfolio Url')}
                                                />
                                                <InputError message={errors.portfolio_url} />
                                            </div>

                                            <div>
                                                <Label htmlFor="linkedin_url">{t('Linkedin Url')}</Label>
                                                <Input
                                                    id="linkedin_url"
                                                    type="text"
                                                    value={data.linkedin_url}
                                                    onChange={(e) => setData('linkedin_url', e.target.value)}
                                                    placeholder={t('Enter Linkedin Url')}
                                                />
                                                <InputError message={errors.linkedin_url} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {(jobPostingSettings.visibility.includes('resume') ||
                                    jobPostingSettings.visibility.includes('cover_letter')) && (
                                        <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                            <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                                <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                                    {t('Required Documents')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {jobPostingSettings.visibility.includes('resume') && (
                                                        <div>
                                                            <Label htmlFor="resume">{t('Resume/CV')}</Label>
                                                            <Input
                                                                id="resume"
                                                                type="file"
                                                                onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'resume')}
                                                            />
                                                            <InputError message={errors.resume} />
                                                            {data.resume ? (
                                                                <div className="mt-2 p-2 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-700">
                                                                    <div className="flex items-center space-x-2">
                                                                        {resumePreview ? (
                                                                            <img src={resumePreview} alt="Resume preview" className="h-12 w-12 object-cover rounded" />
                                                                        ) : (
                                                                            getFileIcon(data.resume.name)
                                                                        )}
                                                                        <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{data.resume.name}</span>
                                                                    </div>
                                                                </div>
                                                            ) : candidate.resume_path ? (
                                                                <div className="mt-2 p-2 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-700">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-2">
                                                                            <FileText className="h-8 w-8 text-red-500" />
                                                                            <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{t('Current Resume')}</span>
                                                                        </div>
                                                                        <a
                                                                            href={getImagePath(candidate.resume_path)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            {t('View Current')}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}

                                                    {jobPostingSettings.visibility.includes('cover_letter') && (
                                                        <div>
                                                            <Label htmlFor="cover_letter">{t('Cover Letter')}</Label>
                                                            <Input
                                                                id="cover_letter"
                                                                type="file"
                                                                onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'cover_letter')}
                                                            />
                                                            <InputError message={errors.cover_letter} />
                                                            {data.cover_letter ? (
                                                                <div className="mt-2 p-2 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-700">
                                                                    <div className="flex items-center space-x-2">
                                                                        {coverLetterPreview ? (
                                                                            <img src={coverLetterPreview} alt="Cover letter preview" className="h-12 w-12 object-cover rounded" />
                                                                        ) : (
                                                                            getFileIcon(data.cover_letter.name)
                                                                        )}
                                                                        <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{data.cover_letter.name}</span>
                                                                    </div>
                                                                </div>
                                                            ) : candidate.cover_letter_path ? (
                                                                <div className="mt-2 p-2 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-700">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-2">
                                                                            <FileText className="h-8 w-8 text-red-500" />
                                                                            <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{t('Current Cover Letter')}</span>
                                                                        </div>
                                                                        <a
                                                                            href={getImagePath(candidate.cover_letter_path)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            {t('View Current')}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                {customQuestions.length > 0 && (
                                    <Card className="border border-gray-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-955">
                                        <CardHeader className="border-b border-gray-300 dark:border-zinc-700 px-6 py-4">
                                            <CardTitle className="text-base font-bold text-gray-900 dark:text-zinc-100">
                                                {t('Application Questions')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {customQuestions.map((question: any) => (
                                                    <div key={question.id} className="space-y-2">
                                                        <Label htmlFor={`custom_question_${question.id}`}>
                                                            {question.question}
                                                            {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        {question.type === 'text' && (
                                                            <Input
                                                                id={`custom_question_${question.id}`}
                                                                type="text"
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onChange={(e) => setData(`custom_question_${question.id}`, e.target.value)}
                                                                placeholder={t('Enter your answer')}
                                                            />
                                                        )}
                                                        {question.type === 'textarea' && (
                                                            <Textarea
                                                                id={`custom_question_${question.id}`}
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onChange={(e) => setData(`custom_question_${question.id}`, e.target.value)}
                                                                placeholder={t('Enter your answer')}
                                                                rows={3}
                                                            />
                                                        )}
                                                        {question.type === 'select' && (
                                                            <Select
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onValueChange={(value) => setData(`custom_question_${question.id}`, value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={t('Select an option')} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {question.options && JSON.parse(question.options).map((option: string, index: number) => (
                                                                        <SelectItem key={index} value={option}>
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {question.type === 'radio' && (
                                                            <RadioGroup
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onValueChange={(value) => setData(`custom_question_${question.id}`, value)}
                                                                className="flex flex-col gap-2 pt-1"
                                                            >
                                                                {question.options && JSON.parse(question.options).map((option: string, index: number) => (
                                                                    <div key={index} className="flex items-center space-x-2">
                                                                        <RadioGroupItem value={option} id={`custom_question_${question.id}_${index}`} />
                                                                        <Label htmlFor={`custom_question_${question.id}_${index}`} className="text-sm font-normal">
                                                                            {option}
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        )}
                                                        {question.type === 'checkbox' && (
                                                            <div className="flex flex-col gap-2 pt-1">
                                                                {question.options && JSON.parse(question.options).map((option: string, index: number) => (
                                                                    <div key={index} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={`custom_question_${question.id}_${index}`}
                                                                            checked={(data[`custom_question_${question.id}`] || '').split(',').includes(option)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentValues = (data[`custom_question_${question.id}`] || '').split(',').filter(v => v);
                                                                                if (checked) {
                                                                                    setData(`custom_question_${question.id}`, [...currentValues, option].join(','));
                                                                                } else {
                                                                                    setData(`custom_question_${question.id}`, currentValues.filter(v => v !== option).join(','));
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label htmlFor={`custom_question_${question.id}_${index}`} className="text-sm font-normal">
                                                                            {option}
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {question.type === 'date' && (
                                                            <Input
                                                                id={`custom_question_${question.id}`}
                                                                type="date"
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onChange={(e) => setData(`custom_question_${question.id}`, e.target.value)}
                                                            />
                                                        )}
                                                        {question.type === 'number' && (
                                                            <Input
                                                                id={`custom_question_${question.id}`}
                                                                type="number"
                                                                value={data[`custom_question_${question.id}`] || ''}
                                                                onChange={(e) => setData(`custom_question_${question.id}`, e.target.value)}
                                                                placeholder={t('Enter a number')}
                                                            />
                                                        )}
                                                        <InputError message={errors[`custom_question_${question.id}`] || customErrors[`custom_question_${question.id}`]} />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Form Actions Footer */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-300 dark:border-zinc-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={currentStep === 1 ? handleCancel : handleBack}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {currentStep === 1 ? t('Cancel') : t('Back')}
                            </Button>

                            <div className="flex gap-2">
                                {currentStep < steps.length ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="gap-2"
                                    >
                                        {t('Next')}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled={processing}
                                        onClick={handleSubmit}
                                        className="gap-2"
                                    >
                                        {processing ? t('Saving...') : t('Save Candidate')}
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}