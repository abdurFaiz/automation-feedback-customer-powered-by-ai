'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Switch,
    Chip,
    Progress,
    Pagination,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Tabs,
    Tab,
    Textarea,
    Radio,
    RadioGroup,
    Checkbox,
    Breadcrumbs,
    BreadcrumbItem,
} from '@heroui/react'
import { Plus, ChevronDown, Trash2, Share2, Copy, Link as LinkIcon, QrCode, Download, Eye, Upload, Menu, FileText, CheckSquare, CheckCircle2, Type, AlertCircle, Edit, Search as SearchIcon } from 'lucide-react'

import { api } from "@/trpc/react"

type QuestionType = 'single' | 'multiple' | 'freetext'

type Question = {
    id: string
    question: string
    type: QuestionType
    answers: string[]
    correctAnswers: string[]
    file?: string
    required?: boolean
}

// Adapting to Prisma model shape approx
type Survey = {
    id: string
    name: string
    icon: string
    iconBg: string
    views: number
    responses: number
    completionRate: number
    created: string
    lastResponse: string
    status: boolean
}

export default function SurveyManage() {
    const utils = api.useUtils()
    const { data: surveysData, isLoading } = api.survey.getAll.useQuery()

    // Transform backend data to UI format
    const surveys: Survey[] = useMemo(() => {
        if (!surveysData) return []
        return surveysData.map(s => ({
            id: s.id,
            name: s.title,
            icon: s.icon || '📝',
            iconBg: s.color || 'bg-gray-100', // Default color
            views: s.views,
            responses: s._count.responses,
            completionRate: s.views > 0 ? (s._count.responses / s.views) * 100 : 0, // Approx
            created: s.createdAt.toLocaleDateString(),
            lastResponse: s.updatedAt.toLocaleTimeString(), // Placeholder for last response
            status: s.isActive
        }))
    }, [surveysData])

    const [selectedPeriod, setSelectedPeriod] = useState('Period')
    const [selectedTime, setSelectedTime] = useState('All time')
    const [selectedLabels, setSelectedLabels] = useState('All responses (48)')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [activeTab, setActiveTab] = useState<'responses' | 'summary'>('responses')

    const toggleStatusMutation = api.survey.toggleStatus.useMutation({
        onSuccess: () => utils.survey.getAll.invalidate()
    })

    const deleteMutation = api.survey.delete.useMutation({
        onSuccess: () => {
            setDeleteModalOpen(false)
            setSelectedSurveyForDelete(null)
            utils.survey.getAll.invalidate()
        }
    })

    const createMutation = api.survey.create.useMutation({
        onSuccess: () => {
            setIsCreatingForm(false)
            // Reset form
            setFormCategory('')
            setFormQuestions([{
                id: '1',
                question: '',
                type: 'single',
                answers: ['', ''],
                correctAnswers: ['0'],
            }])
            utils.survey.getAll.invalidate()
        }
    })

    const handleStatusToggle = (id: string, newStatus: boolean) => {
        // Optimistic update could be done here, but invalidation is safer for now
        toggleStatusMutation.mutate({ id, isActive: newStatus })
    }

    const [page, setPage] = useState(1)
    const rowsPerPage = 5
    const pages = Math.ceil(surveys.length / rowsPerPage)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [selectedSurveyForShare, setSelectedSurveyForShare] = useState<Survey | null>(null)
    const [copied, setCopied] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedSurveyForDelete, setSelectedSurveyForDelete] = useState<Survey | null>(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [selectedSurveyForDetail, setSelectedSurveyForDetail] = useState<Survey | null>(null)
    const { data: surveyResponses } = api.survey.getResponses.useQuery(
        { surveyId: selectedSurveyForDetail?.id || '' },
        { enabled: !!selectedSurveyForDetail }
    )

    // Sorting and Filtering for Responses
    const [responseSortOrder, setResponseSortOrder] = useState<'newest' | 'oldest'>('newest')
    const [responseSearchQuery, setResponseSearchQuery] = useState('')

    const sortedAndFilteredResponses = useMemo(() => {
        if (!surveyResponses) return []

        let processed = [...surveyResponses]

        // Filter
        if (responseSearchQuery) {
            const lowerQuery = responseSearchQuery.toLowerCase()
            processed = processed.filter(r =>
                r.id.toLowerCase().includes(lowerQuery) ||
                r.answers.some(a => a.answer.toLowerCase().includes(lowerQuery))
            )
        }

        // Sort
        processed.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return responseSortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

        return processed
    }, [surveyResponses, responseSearchQuery, responseSortOrder])

    // Pagination for Responses
    const [responsePage, setResponsePage] = useState(1)
    const responsesPerPage = 5
    const totalResponsePages = Math.ceil(sortedAndFilteredResponses.length / responsesPerPage)

    const paginatedResponses = useMemo(() => {
        const start = (responsePage - 1) * responsesPerPage
        return sortedAndFilteredResponses.slice(start, start + responsesPerPage)
    }, [sortedAndFilteredResponses, responsePage])

    // Response Detail Modal
    const [selectedResponse, setSelectedResponse] = useState<any>(null) // Replace 'any' with inferred type from TRPC if possible, or keep flexible
    const [viewResponseModalOpen, setViewResponseModalOpen] = useState(false)

    const [createFormModalOpen, setCreateFormModalOpen] = useState(false)
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
    const [origin, setOrigin] = useState('https://forms.spinofy.com')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin)
        }
    }, [])

    const [formCategory, setFormCategory] = useState('')
    const [formQuestions, setFormQuestions] = useState<Question[]>([
        {
            id: '1',
            question: '',
            type: 'single',
            answers: ['', ''],
            correctAnswers: ['0'],
        }
    ])
    const [isCreatingForm, setIsCreatingForm] = useState(false)
    const [isViewingDetail, setIsViewingDetail] = useState(false)
    const [activeQuestionId, setActiveQuestionId] = useState<string>('1')
    const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [isSaving, setIsSaving] = useState(false)

    const paginatedSurveys = useMemo(() => {
        const start = (page - 1) * rowsPerPage
        const end = start + rowsPerPage
        return (surveys || []).slice(start, end)
    }, [page, surveys])

    const handleShare = (survey: Survey) => {
        setSelectedSurveyForShare(survey)
        setShareModalOpen(true)
        setCopied(false)
    }

    const handleRowClick = (survey: Survey) => {
        setSelectedSurveyForDetail(survey)
        setIsViewingDetail(true)
        setIsCreatingForm(false)
        // setDetailModalOpen(true) // No longer needed
    }

    const handleDelete = (survey: Survey) => {
        setSelectedSurveyForDelete(survey)
        setDeleteModalOpen(true)
    }

    const [isEditing, setIsEditing] = useState(false)
    const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null)
    const { data: surveyToEdit } = api.survey.getById.useQuery(
        { id: editingSurveyId! },
        { enabled: !!editingSurveyId && isEditing }
    )

    const updateMutation = api.survey.update.useMutation({
        onSuccess: () => {
            utils.survey.getAll.invalidate()
            setIsCreatingForm(false)
            setCreateFormModalOpen(false)
            setFormCategory('')
            setFormQuestions([{
                id: '1',
                question: '',
                type: 'single',
                answers: ['', ''],
                correctAnswers: ['0'],
            }])
            setIsEditing(false)
            setEditingSurveyId(null)
            setIsSaving(false)
        },
        onError: (error) => {
            console.error("Failed to update survey:", error)
            alert("Failed to update survey. Please try again.")
            setIsSaving(false)
        }
    })

    useEffect(() => {
        if (isEditing && surveyToEdit) {
            setFormCategory(surveyToEdit.title)
            if (surveyToEdit.questions.length > 0) {
                setFormQuestions(surveyToEdit.questions.map(q => ({
                    id: q.id, // Use real ID
                    question: q.question,
                    type: (q.type === 'textarea' ? 'freetext' : (q.type === 'checkbox' ? 'multiple' : 'single')) as QuestionType,
                    answers: q.options,
                    correctAnswers: [],
                    required: q.required
                })))
                setActiveQuestionId(surveyToEdit.questions[0]?.id || '')
            } else {
                setFormQuestions([{
                    id: '1',
                    question: '',
                    type: 'single',
                    answers: ['', ''],
                    correctAnswers: ['0'],
                }])
            }
        }
    }, [surveyToEdit, isEditing])

    const handleEditSurvey = (survey: Survey) => {
        setIsEditing(true)
        setEditingSurveyId(survey.id)
        // Set basic info immediately, detailed questions will load via useEffect
        setFormCategory(survey.name)
        setIsCreatingForm(true) // Re-use creation view
    }

    const confirmDelete = () => {
        if (selectedSurveyForDelete) {
            deleteMutation.mutate({ id: selectedSurveyForDelete.id })
        }
    }

    const handleSaveForm = () => {
        if (!formCategory) {
            // Basic validation
            alert("Please provide a form name/category")
            return
        }

        setIsSaving(true)

        if (isEditing && editingSurveyId) {
            updateMutation.mutate({
                id: editingSurveyId,
                title: formCategory,
                description: "Edited via Survey Manager",
                questions: formQuestions.map((q, idx) => ({
                    id: q.id.length > 10 ? q.id : undefined, // Send ID only if it looks like a real UUID (not '1', '2' etc)
                    question: q.question,
                    type: q.type === 'freetext' ? 'textarea' : (q.type === 'multiple' ? 'checkbox' : 'radio'),
                    options: q.type !== 'freetext' ? q.answers : [],
                    required: q.required || false,
                    order: idx
                }))
            })
        } else {
            createMutation.mutate({
                title: formCategory,
                description: "Created via Survey Manager",
                questions: formQuestions.map((q, idx) => ({
                    question: q.question,
                    type: q.type === 'freetext' ? 'textarea' : (q.type === 'multiple' ? 'checkbox' : 'radio'),
                    options: q.type !== 'freetext' ? q.answers : [],
                    required: q.required || false,
                    order: idx
                }))
            }, {
                onSettled: () => setIsSaving(false)
            })
        }
    }

    const copyToClipboard = async () => {
        const shareLink = `${origin}/survey-form/${selectedSurveyForShare?.id}`
        await navigator.clipboard.writeText(shareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQRCode = async () => {
        if (!selectedSurveyForShare) return

        const targetUrl = `${origin}/survey-form/${selectedSurveyForShare.id}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`

        try {
            const response = await fetch(qrUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `qr-code-${selectedSurveyForShare.name.replace(/\s+/g, '-').toLowerCase()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to download QR code:', error)
        }
    }

    const shareQRCodeImage = async () => {
        if (!selectedSurveyForShare) return

        const targetUrl = `${origin}/survey-form/${selectedSurveyForShare.id}`
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`

        try {
            const response = await fetch(qrUrl)
            const blob = await response.blob()
            const file = new File([blob], `qr-code-${selectedSurveyForShare.name}.png`, { type: 'image/png' })

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Survey QR Code',
                    text: `QR Code for ${selectedSurveyForShare.name}`,
                    url: targetUrl
                })
            } else {
                alert('Sharing is not supported on this device. Please use the download button instead.')
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to share QR code:', error)
            }
        }
    }

    const handleCreateFormClick = () => {
        setIsCreatingForm(true)
        setIsViewingDetail(false)
    }

    const handleCancelCreateForm = () => {
        const hasContent = formCategory || formQuestions.some(q =>
            q.question || q.answers.some(a => a)
        )
        if (hasContent) {
            setCancelConfirmOpen(true)
        } else {
            setIsCreatingForm(false)
        }
    }

    const confirmCancelCreateForm = () => {
        setIsCreatingForm(false)
        setCancelConfirmOpen(false)
        // Reset form
        setFormCategory('')
        setFormQuestions([{
            id: '1',
            question: '',
            type: 'single',
            answers: ['', ''],
            correctAnswers: ['0'],
        }])
        setIsEditing(false)
        setEditingSurveyId(null)
    }



    const duplicateQuestion = (questionId: string) => {
        const questionToDuplicate = formQuestions.find(q => q.id === questionId)
        if (questionToDuplicate) {
            const newQuestion = {
                ...questionToDuplicate,
                id: String(Date.now()),
            }
            setFormQuestions([...formQuestions, newQuestion])
        }
    }

    const addQuestion = () => {
        const newQuestion: Question = {
            id: String(Date.now()),
            question: '',
            type: 'single',
            answers: ['', ''],
            correctAnswers: ['0'],
        }
        setFormQuestions([...formQuestions, newQuestion])
    }

    const removeQuestion = (id: string) => {
        setFormQuestions(formQuestions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setFormQuestions(formQuestions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ))
    }

    const addAnswer = (questionId: string) => {
        setFormQuestions(formQuestions.map(q => {
            if (q.id === questionId) {
                return { ...q, answers: [...q.answers, ''] }
            }
            return q
        }))
    }

    const removeAnswer = (questionId: string, index: number) => {
        setFormQuestions(formQuestions.map(q => {
            if (q.id === questionId) {
                const newAnswers = q.answers.filter((_, i) => i !== index)
                const newCorrectAnswers = q.correctAnswers.filter(a => parseInt(a) !== index)
                    .map(a => String(parseInt(a) > index ? parseInt(a) - 1 : parseInt(a)))
                return {
                    ...q,
                    answers: newAnswers,
                    correctAnswers: newCorrectAnswers.length > 0 ? newCorrectAnswers : ['0']
                }
            }
            return q
        }))
    }

    const updateAnswer = (questionId: string, index: number, value: string) => {
        setFormQuestions(formQuestions.map(q => {
            if (q.id === questionId) {
                const newAnswers = [...q.answers]
                newAnswers[index] = value
                return { ...q, answers: newAnswers }
            }
            return q
        }))
    }

    const toggleCorrectAnswer = (questionId: string, answerIndex: string) => {
        setFormQuestions(formQuestions.map(q => {
            if (q.id === questionId) {
                if (q.type === 'single') {
                    return { ...q, correctAnswers: [answerIndex] }
                } else if (q.type === 'multiple') {
                    const isSelected = q.correctAnswers.includes(answerIndex)
                    const newCorrectAnswers = isSelected
                        ? q.correctAnswers.filter(a => a !== answerIndex)
                        : [...q.correctAnswers, answerIndex]
                    return { ...q, correctAnswers: newCorrectAnswers.length > 0 ? newCorrectAnswers : [answerIndex] }
                }
            }
            return q
        }))
    }

    const scrollToQuestion = (questionId: string) => {
        setActiveQuestionId(questionId)
        questionRefs.current[questionId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }

    const calculateProgress = () => {
        const totalQuestions = formQuestions.length
        const completedQuestions = formQuestions.filter(q => {
            const hasQuestion = q.question.trim() !== ''
            const hasAnswers = q.type === 'freetext' || q.answers.some(a => a.trim() !== '')
            return hasQuestion && hasAnswers
        }).length
        return { completed: completedQuestions, total: totalQuestions, percentage: Math.round((completedQuestions / totalQuestions) * 100) }
    }

    const getQuestionTypeIcon = (type: QuestionType) => {
        switch (type) {
            case 'single':
                return <CheckCircle2 className="h-3 w-3" />
            case 'multiple':
                return <CheckSquare className="h-3 w-3" />
            case 'freetext':
                return <Type className="h-3 w-3" />
            default:
                return <FileText className="h-3 w-3" />
        }
    }

    return (
        <div className="w-full space-y-6">
            {/* Breadcrumbs Navigation - Only show in Create Form */}
            {isCreatingForm && (
                <Breadcrumbs>
                    <BreadcrumbItem
                        onPress={() => handleCancelCreateForm()}
                        className="cursor-pointer"
                    >
                        Survey Management
                    </BreadcrumbItem>
                    <BreadcrumbItem>Create Form</BreadcrumbItem>
                </Breadcrumbs>
            )}

            {/* Conditional Content */}
            {!isCreatingForm && !isViewingDetail ? (
                <>
                    {/* Tabs and Filters Section */}
                    <div className="flex flex-col gap-4">
                        {/* Tabs */}
                        {/* Tabs Section */}
                        <Tabs
                            variant='underlined'
                            selectedKey={activeTab}
                            onSelectionChange={(key) => setActiveTab(key as 'responses' | 'summary')}
                            classNames={{
                                tabList: 'gap-8 bg-transparent p-0',
                                cursor: 'bg-primary',
                                tab: 'px-0 pb-3 h-auto',
                                tabContent: 'group-data-[selected=true]:text-primary text-gray-400 font-semibold',
                            }}
                        >
                            <Tab key="responses" title="RESPONSES" />
                            <Tab key="summary" title="SUMMARY" />
                        </Tabs>

                        {/* Filter Dropdowns */}
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex flex-row justify-between item-center w-full">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                endContent={<ChevronDown className="h-4 w-4" />}
                                                className="rounded-lg border-gray-300"
                                            >
                                                {selectedPeriod}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Period selection"
                                            onAction={(key) => setSelectedPeriod(String(key))}
                                        >
                                            <DropdownItem key="Period">Period</DropdownItem>
                                            <DropdownItem key="Today">Today</DropdownItem>
                                            <DropdownItem key="This Week">This Week</DropdownItem>
                                            <DropdownItem key="This Month">This Month</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>

                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                endContent={<ChevronDown className="h-4 w-4" />}
                                                className="rounded-lg border-gray-300"
                                            >
                                                {selectedTime}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Time selection"
                                            onAction={(key) => setSelectedTime(String(key))}
                                        >
                                            <DropdownItem key="All time">All time</DropdownItem>
                                            <DropdownItem key="Last 7 days">Last 7 days</DropdownItem>
                                            <DropdownItem key="Last 30 days">Last 30 days</DropdownItem>
                                            <DropdownItem key="Last 90 days">Last 90 days</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>

                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                endContent={<ChevronDown className="h-4 w-4" />}
                                                className="rounded-lg border-gray-300"
                                            >
                                                Labels: {selectedLabels}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Labels selection"
                                            onAction={(key) => setSelectedLabels(String(key))}
                                        >
                                            <DropdownItem key="All responses (48)">All responses (48)</DropdownItem>
                                            <DropdownItem key="Completed (35)">Completed (35)</DropdownItem>
                                            <DropdownItem key="Incomplete (13)">Incomplete (13)</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>

                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="bordered"
                                                endContent={<ChevronDown className="h-4 w-4" />}
                                                className="rounded-lg border-gray-300"
                                            >
                                                Status: {selectedStatus}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Status selection"
                                            onAction={(key) => setSelectedStatus(String(key))}
                                        >
                                            <DropdownItem key="All">All</DropdownItem>
                                            <DropdownItem key="Active">Active</DropdownItem>
                                            <DropdownItem key="Inactive">Inactive</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                                <Button
                                    color="primary"
                                    size="lg"
                                    startContent={<Plus className="h-5 w-5" />}
                                    className="rounded-full bg-primary font-semibold shadow-lg transition-transform hover:scale-105"
                                    onPress={handleCreateFormClick}
                                >
                                    New Survey
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161616] p-2 shadow-sm transition-colors duration-300">
                        <Table
                            aria-label="Survey management table"
                            removeWrapper
                            classNames={{
                                th: 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider px-4 first:pl-6 last:pr-6 py-4 border-b-8 border-white dark:border-[#161616] transition-colors duration-300',
                                td: 'py-4 px-4 first:pl-6 last:pr-6',
                                tr: 'border-b border-gray-100 dark:border-white/5 transition-colors duration-300',
                            }}
                        >
                            <TableHeader>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>FORM NAME</TableColumn>
                                <TableColumn>VIEWS</TableColumn>
                                <TableColumn>RESPONSES</TableColumn>
                                <TableColumn>COMPLETION RATE</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                                <TableColumn>LAST RESPONSE</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {paginatedSurveys.map((survey) => (
                                    <TableRow
                                        key={survey.id}
                                        className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-300"
                                        onClick={() => handleRowClick(survey)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Switch
                                                isSelected={survey.status}
                                                onValueChange={(newStatus) =>
                                                    handleStatusToggle(survey.id, newStatus)
                                                }
                                                size="sm"
                                                classNames={{
                                                    wrapper: survey.status
                                                        ? 'bg-primary'
                                                        : 'bg-gray-300',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${survey.iconBg}`}
                                                >
                                                    {survey.icon}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                                                    {survey.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">{survey.views.toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                                                {survey.responses}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={survey.completionRate}
                                                    size="sm"
                                                    className="w-20"
                                                    classNames={{
                                                        indicator: survey.completionRate > 50 ? 'bg-primary' : 'bg-primary',
                                                    }}
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                    {survey.completionRate.toFixed(2)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{survey.created}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{survey.lastResponse}</span>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => handleShare(survey)}
                                                    className="text-primary hover:bg-primary/10"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => handleEditSurvey(survey)}
                                                    className="text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={() => handleDelete(survey)}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination - Inside Table */}
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#161616] px-6 py-3 rounded-b-2xl transition-colors duration-300">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Page {page} of {pages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setPage(1)}
                                    isDisabled={page === 1}
                                    className="min-w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <span className="text-3xl">«</span>
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setPage(page - 1)}
                                    isDisabled={page === 1}
                                    className="min-w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <span className="text-3xl">‹</span>
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setPage(page + 1)}
                                    isDisabled={page === pages}
                                    className="min-w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <span className="text-3xl">›</span>
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setPage(pages)}
                                    isDisabled={page === pages}
                                    className="min-w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <span className="text-3xl">»</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Share Modal */}
                    <Modal
                        isOpen={shareModalOpen}
                        onClose={() => setShareModalOpen(false)}
                        size="2xl"
                    >
                        <ModalContent className="dark:bg-[#1f1f1f] dark:text-white dark:border dark:border-white/10">
                            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-white/5">
                                <h3 className="text-xl font-bold">Share Survey</h3>
                                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">{selectedSurveyForShare?.name}</p>
                            </ModalHeader>
                            <ModalBody className="pb-6 pt-4">
                                <div className="space-y-6">
                                    {/* Share Link Section */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <LinkIcon className="h-4 w-4" />
                                            Share Link
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={`${origin}/survey-form/${selectedSurveyForShare?.id}`}
                                                readOnly
                                                className="flex-1"
                                                classNames={{
                                                    input: 'text-sm',
                                                }}
                                            />
                                            <Button
                                                color={copied ? 'success' : 'primary'}
                                                onPress={copyToClipboard}
                                                startContent={<Copy className="h-4 w-4" />}
                                                className="font-semibold"
                                            >
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* QR Code Section */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <QrCode className="h-4 w-4" />
                                            QR Code
                                        </label>
                                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-white/10 dark:bg-zinc-800/50 p-8 transition-colors duration-300">
                                            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4 shadow-md">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://forms.spinofy.com/survey/${selectedSurveyForShare?.id}`}
                                                    alt="QR Code"
                                                    className="h-full w-full"
                                                />
                                            </div>
                                            <p className="mt-4 text-sm text-gray-500">
                                                Scan this code to access the survey
                                            </p>

                                            {/* Action Buttons */}
                                            <div className="mt-4 flex gap-2">
                                                <Button
                                                    variant="flat"
                                                    startContent={<Download className="h-4 w-4" />}
                                                    onPress={downloadQRCode}
                                                    className="font-semibold text-white bg-primary"
                                                >
                                                    Download
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    variant="bordered"
                                                    startContent={<Share2 className="h-4 w-4" />}
                                                    onPress={shareQRCodeImage}
                                                    className="font-semibold"
                                                >
                                                    Share Image
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        size="md"
                    >
                        <ModalContent className="dark:bg-[#1f1f1f] dark:text-white dark:border dark:border-white/10">
                            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-white/5">
                                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Survey</h3>
                            </ModalHeader>
                            <ModalBody className="py-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                    Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{selectedSurveyForDelete?.name}"</span>?
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This action cannot be undone. All responses and data associated with this survey will be permanently deleted.
                                </p>
                            </ModalBody>
                            <ModalFooter className="border-t border-gray-200 dark:border-white/5">
                                <Button
                                    variant="light"
                                    onPress={() => setDeleteModalOpen(false)}
                                    className="dark:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={confirmDelete}
                                    className="font-semibold"
                                >
                                    Delete Survey
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>



                </>) : isViewingDetail ? (
                    // Survey Detail View (Migrated from Modal to Full Page)
                    <div className="flex flex-col max-w-5xl mx-auto gap-4">
                        {/* Header */}
                        <div className="flex flex-row items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <Button isIconOnly variant="light" onPress={() => setIsViewingDetail(false)} className="text-gray-500 dark:text-gray-400">
                                    <ChevronDown className="h-6 w-6 rotate-90" /> {/* Simulate Back Arrow */}
                                </Button>
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${selectedSurveyForDetail?.iconBg}`}
                                >
                                    {selectedSurveyForDetail?.icon}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{selectedSurveyForDetail?.name}</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Survey Details</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-6 bg-white dark:bg-[#161616] p-6 rounded-xl border border-gray-200 dark:border-white/10 transition-colors duration-300">
                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Status
                                </label>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={selectedSurveyForDetail?.status}
                                        size="sm"
                                        classNames={{
                                            wrapper: selectedSurveyForDetail?.status
                                                ? 'bg-primary'
                                                : 'bg-gray-300',
                                        }}
                                        isReadOnly
                                    />
                                    <span className="text-gray-700">
                                        {selectedSurveyForDetail?.status ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Survey Metrics
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Views */}
                                    <div className="rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-zinc-800/50 p-4 transition-colors duration-300">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Eye className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase">Views</span>
                                        </div>
                                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                            {selectedSurveyForDetail?.views.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Responses */}
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Share2 className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase">Responses</span>
                                        </div>
                                        <p className="mt-2 text-3xl font-bold text-primary">
                                            {selectedSurveyForDetail?.responses}
                                        </p>
                                    </div>
                                    {/* Completion Rate */}
                                    <div>
                                        <div className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-zinc-800/30 p-4 transition-colors duration-300">
                                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Completion Rate
                                            </label>
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                                    {selectedSurveyForDetail?.completionRate.toFixed(2)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={selectedSurveyForDetail?.completionRate || 0}
                                                className="mt-3"
                                                classNames={{
                                                    indicator: 'bg-primary',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Created
                                    </label>
                                    <div className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-zinc-800/50 p-3 transition-colors duration-300">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedSurveyForDetail?.created}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Last Response
                                    </label>
                                    <div className="rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-zinc-800/50 p-3 transition-colors duration-300">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedSurveyForDetail?.lastResponse}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Survey Responses */}
                            <div>
                                <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Latest Responses ({surveyResponses?.length || 0})
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Search responses..."
                                            value={responseSearchQuery}
                                            onValueChange={setResponseSearchQuery}
                                            startContent={<SearchIcon className="h-4 w-4 text-gray-400" />}
                                            size="sm"
                                            className="w-full sm:w-64"
                                            classNames={{
                                                inputWrapper: "h-9 dark:bg-zinc-800 dark:border-zinc-700 hover:dark:border-gray-500",
                                                input: "dark:text-white",
                                            }}
                                        />
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    variant="bordered"
                                                    size="sm"
                                                    endContent={<ChevronDown className="h-4 w-4" />}
                                                    className="h-9 min-w-[120px] dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                                                >
                                                    {responseSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                aria-label="Sort responses"
                                                onAction={(key) => setResponseSortOrder(key as 'newest' | 'oldest')}
                                                className="dark:bg-[#1f1f1f] dark:border dark:border-white/10"
                                                itemClasses={{
                                                    base: "dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                                                }}
                                            >
                                                <DropdownItem key="newest">Newest First</DropdownItem>
                                                <DropdownItem key="oldest">Oldest First</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>
                                <div className="space-y-4 max-h-[600px] pr-2">
                                    <Table
                                        aria-label="Survey responses table"
                                        removeWrapper
                                        classNames={{
                                            th: 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider px-4 py-3 border-b dark:border-white/5',
                                            td: 'px-4 py-3 border-b border-gray-100 dark:border-white/5 text-gray-900 dark:text-gray-300',
                                        }}
                                    >
                                        <TableHeader>
                                            <TableColumn>RESPONSE ID</TableColumn>
                                            <TableColumn>DATE</TableColumn>
                                            <TableColumn>SUMMARY</TableColumn>
                                            <TableColumn>ACTIONS</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="No responses found.">
                                            {paginatedResponses.map((response) => (
                                                <TableRow key={response.id}>
                                                    <TableCell>
                                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {response.id.slice(-4)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {new Date(response.createdAt).toLocaleString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-md truncate text-sm text-gray-600 dark:text-gray-400">
                                                            {response.answers.length > 0
                                                                ? `${response.answers.length} answers provided`
                                                                : 'No answers'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="primary"
                                                            onPress={() => {
                                                                setSelectedResponse(response)
                                                                setViewResponseModalOpen(true)
                                                            }}
                                                        >
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {!surveyResponses?.length ? (
                                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                            <p className="text-gray-400">No responses recorded yet.</p>
                                        </div>
                                    ) : (
                                        totalResponsePages > 1 && (
                                            <div className="flex w-full justify-center mt-4">
                                                <Pagination
                                                    isCompact
                                                    showControls
                                                    showShadow
                                                    color="primary"
                                                    page={responsePage}
                                                    total={totalResponsePages}
                                                    onChange={(page) => setResponsePage(page)}
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 border-t border-gray-200 pt-6">
                                <Button
                                    color="primary"
                                    className="flex-1 font-semibold"
                                    startContent={<Share2 className="h-4 w-4" />}
                                    onPress={() => {
                                        if (selectedSurveyForDetail) {
                                            handleShare(selectedSurveyForDetail)
                                            // onClose() // Removed for full page
                                        }
                                    }}
                                >
                                    Share Survey
                                </Button>
                                <Button
                                    color="success"
                                    variant="flat"
                                    className="flex-1 font-semibold"
                                    startContent={<Download className="h-4 w-4" />}
                                    onPress={() => {
                                        if (surveyResponses && surveyResponses.length > 0) {
                                            const firstResponse = surveyResponses[0]
                                            if (!firstResponse) return

                                            // Collect unique questions. Assuming all responses have answers to all questions or at least we take headers from first one.
                                            // We should sort answers by question order ideally, but here just taking from first answer set.
                                            const headers = ["Response ID", "Date", ...firstResponse.answers.map(a => a.question.question)]

                                            const rows = surveyResponses.map(r => {
                                                const answerMap = new Map(r.answers.map(a => [a.questionId, a.answer]))
                                                return [
                                                    r.id,
                                                    new Date(r.createdAt).toLocaleString(),
                                                    ...firstResponse.answers.map(a => {
                                                        let ans = answerMap.get(a.questionId) || ''
                                                        if (ans.startsWith('[')) {
                                                            try { ans = JSON.parse(ans).join(', ') } catch (e) { }
                                                        }
                                                        return `"${ans.replace(/"/g, '""')}"`
                                                    })
                                                ]
                                            })

                                            const csvContent = "data:text/csv;charset=utf-8,"
                                                + [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n")

                                            const encodedUri = encodeURI(csvContent)
                                            const link = document.createElement("a")
                                            link.setAttribute("href", encodedUri)
                                            link.setAttribute("download", `survey_${selectedSurveyForDetail?.name.replace(/\s+/g, '_')}_responses.csv`)
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                        } else {
                                            alert("No responses to export")
                                        }
                                    }}
                                >
                                    Export CSV
                                </Button>
                                <Button
                                    color="danger"
                                    variant="bordered"
                                    className="flex-1 font-semibold"
                                    startContent={<Trash2 className="h-4 w-4" />}
                                    onPress={() => {
                                        if (selectedSurveyForDetail) {
                                            handleDelete(selectedSurveyForDetail)
                                            setIsViewingDetail(false) // Close view on delete
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                <>
                    {/* Create Form Section */}
                    <div className="flex flex-col  max-w-5xl mx-auto gap-4">
                        {/* Header */}
                        <div className="flex flex-row items-start justify-between">
                            <h1 className="text-2xl font-bold text-title-black dark:text-white transition-colors duration-300">Create Survey</h1>
                            <p className="text-gray-500 dark:text-gray-400">Create a survey for your customers</p>
                        </div>
                        <div className="flex flex-row gap-6  ">
                            {/* Left Section - Question Navigation */}
                            <div className="flex w-64 flex-col gap-3">
                                <div className="sticky top-6 space-y-3">
                                    {/* Progress Indicator */}
                                    <div className="rounded-lg bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-3 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Progress</span>
                                            <span className="text-xs font-bold text-primary">{calculateProgress().percentage}%</span>
                                        </div>
                                        <Progress
                                            value={calculateProgress().percentage}
                                            size="sm"
                                            color="primary"
                                            className="h-1.5"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            {calculateProgress().completed} of {calculateProgress().total} questions completed
                                        </p>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Questions</h3>
                                    <div className="space-y-1">
                                        {formQuestions.map((q, index) => (
                                            <button
                                                key={q.id}
                                                onClick={() => scrollToQuestion(q.id)}
                                                className={`w-full rounded-lg p-3 text-left text-sm transition-all ${activeQuestionId === q.id
                                                    ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium border border-primary/20'
                                                    : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-semibold">Question {index + 1}</div>
                                                    <div className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${activeQuestionId === q.id ? 'bg-primary/20' : 'bg-white dark:bg-black/20'
                                                        }`}>
                                                        {getQuestionTypeIcon(q.type)}
                                                    </div>
                                                </div>
                                                <div className="mt-1 truncate text-xs opacity-70">
                                                    {q.question || 'No question text yet'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6 max-w-3xl mx-auto w-full">
                                {/* Form Content */}
                                <div className="rounded-2xl border border-gray-200 dark:border-white/10 max-w-full bg-white dark:bg-[#161616] p-6 shadow-sm transition-colors duration-300">
                                    <div className="space-y-6">
                                        {/* Category */}
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Category
                                            </label>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        variant="bordered"
                                                        endContent={<ChevronDown className="h-4 w-4" />}
                                                        className="w-full justify-between dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                                                    >
                                                        {formCategory || 'Select a category'}
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu
                                                    aria-label="Category selection"
                                                    onAction={(key) => setFormCategory(String(key))}
                                                    className="w-full dark:bg-[#1f1f1f] dark:border dark:border-white/10"
                                                    itemClasses={{
                                                        base: "dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                                                    }}
                                                >
                                                    <DropdownItem key="General">General</DropdownItem>
                                                    <DropdownItem key="Customer Feedback">Customer Feedback</DropdownItem>
                                                    <DropdownItem key="Employee Survey">Employee Survey</DropdownItem>
                                                    <DropdownItem key="Market Research">Market Research</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>

                                        {/* Questions */}
                                        {formQuestions.map((q, qIndex) => (
                                            <div
                                                key={q.id}
                                                ref={(el) => { questionRefs.current[q.id] = el }}
                                                className="space-y-4 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-800/20 p-4 transition-colors duration-300"
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Menu className="h-5 w-5 text-gray-400" />
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Question {qIndex + 1}</span>
                                                        <span className="text-red-500">*</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => duplicateQuestion(q.id)}
                                                            className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                                            title="Duplicate question"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        {formQuestions.length > 1 && (
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                onPress={() => removeQuestion(q.id)}
                                                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                title="Delete question"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Question Type */}
                                                <div>
                                                    <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                        Question Type
                                                    </label>
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button
                                                                variant="bordered"
                                                                size="sm"
                                                                endContent={<ChevronDown className="h-3 w-3" />}
                                                                className="w-full justify-between dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                                                            >
                                                                {q.type === 'single' ? 'Single Choice' : q.type === 'multiple' ? 'Multiple Choice' : 'Free Text'}
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu
                                                            aria-label="Question type"
                                                            onAction={(key) => updateQuestion(q.id, 'type', key as QuestionType)}
                                                            className="w-full dark:bg-[#1f1f1f] dark:border dark:border-white/10"
                                                            itemClasses={{
                                                                base: "dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                                                            }}
                                                        >
                                                            <DropdownItem key="single">Single Choice</DropdownItem>
                                                            <DropdownItem key="multiple">Multiple Choice</DropdownItem>
                                                            <DropdownItem key="freetext">Free Text</DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>

                                                {/* Question Text */}
                                                <div>
                                                    <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                        Question <span className="text-red-500">*</span>
                                                    </label>
                                                    <Textarea
                                                        placeholder="Write your question here..."
                                                        value={q.question}
                                                        onValueChange={(value) => updateQuestion(q.id, 'question', value)}
                                                        minRows={2}
                                                        maxLength={500}
                                                        classNames={{
                                                            inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700 dark:group-data-[focus=true]:border-primary",
                                                            input: "dark:text-white",
                                                        }}
                                                    />
                                                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                                                        <span>{q.question.length}/500 characters</span>
                                                        {q.question.length >= 450 && (
                                                            <span className="text-orange-500 flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Approaching limit
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* File Upload - Optional */}
                                                <div>
                                                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800/50 p-4 transition-colors duration-300">
                                                        <div className="text-center">
                                                            <Upload className="mx-auto h-6 w-6 text-gray-400" />
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Add image (optional)
                                                            </p>
                                                            <Button
                                                                variant="bordered"
                                                                size="sm"
                                                                className="mt-2 text-xs"
                                                            >
                                                                Browse
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Answers - Only for choice questions */}
                                                {(q.type === 'single' || q.type === 'multiple') && (
                                                    <div>
                                                        <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                            Answer Options
                                                        </label>
                                                        {q.type === 'single' ? (
                                                            <RadioGroup
                                                                value={q.correctAnswers[0]}
                                                                onValueChange={(value) => toggleCorrectAnswer(q.id, value)}
                                                            >
                                                                <div className="space-y-2">
                                                                    {q.answers.map((answer, index) => (
                                                                        <div key={index} className="flex items-center gap-2">
                                                                            <Input
                                                                                placeholder={`Option ${index + 1}`}
                                                                                value={answer}
                                                                                onValueChange={(value) => updateAnswer(q.id, index, value)}
                                                                                size="sm"
                                                                                className="flex-1"
                                                                                classNames={{
                                                                                    inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700",
                                                                                    input: "dark:text-white",
                                                                                }}
                                                                            />
                                                                            <Radio value={String(index)} />
                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                variant="light"
                                                                                onPress={() => removeAnswer(q.id, index)}
                                                                                className="text-red-600 hover:bg-red-50"
                                                                                isDisabled={q.answers.length <= 2}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="light"
                                                                        startContent={<Plus className="h-3 w-3" />}
                                                                        onPress={() => addAnswer(q.id)}
                                                                        className="text-primary"
                                                                    >
                                                                        Add Option
                                                                    </Button>
                                                                </div>
                                                            </RadioGroup>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {q.answers.map((answer, index) => (
                                                                    <div key={index} className="flex items-center gap-2">
                                                                        <Input
                                                                            placeholder={`Option ${index + 1}`}
                                                                            value={answer}
                                                                            onValueChange={(value) => updateAnswer(q.id, index, value)}
                                                                            size="sm"
                                                                            className="flex-1"
                                                                            classNames={{
                                                                                inputWrapper: "dark:bg-zinc-800 dark:border-zinc-700",
                                                                                input: "dark:text-white",
                                                                            }}
                                                                        />
                                                                        <Checkbox
                                                                            isSelected={q.correctAnswers.includes(String(index))}
                                                                            onValueChange={() => toggleCorrectAnswer(q.id, String(index))}
                                                                        />
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            onPress={() => removeAnswer(q.id, index)}
                                                                            className="text-red-600 hover:bg-red-50"
                                                                            isDisabled={q.answers.length <= 2}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                <Button
                                                                    size="sm"
                                                                    variant="light"
                                                                    startContent={<Plus className="h-3 w-3" />}
                                                                    onPress={() => addAnswer(q.id)}
                                                                    className="text-primary"
                                                                >
                                                                    Add Option
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {q.type === 'single'
                                                                ? 'Select one correct answer'
                                                                : 'Select one or more correct answers'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Question Button */}
                                        <Button
                                            variant="bordered"
                                            startContent={<Plus className="h-4 w-4" />}
                                            onPress={addQuestion}
                                            className="w-full dark:border-white/20 dark:text-white dark:hover:bg-zinc-800"
                                        >
                                            Add Question
                                        </Button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
                                    {/* Save Status */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            {calculateProgress().percentage === 100 ? (
                                                <>
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    </div>
                                                    <span className="text-green-600 font-medium">All questions completed!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
                                                        <AlertCircle className="h-3 w-3 text-orange-600" />
                                                    </div>
                                                    <span className="text-gray-600">
                                                        {calculateProgress().total - calculateProgress().completed} question(s) need completion
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <Button
                                            variant="bordered"
                                            size='lg'
                                            onPress={handleCancelCreateForm}
                                            className="dark:border-white/20 dark:text-white dark:hover:bg-zinc-800"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            color="primary"
                                            size='lg'
                                            onPress={handleSaveForm}
                                            className="font-semibold"
                                            isLoading={isSaving}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Survey'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            {/* Cancel Confirmation Modal */}
            <Modal
                isOpen={cancelConfirmOpen}
                onClose={() => setCancelConfirmOpen(false)}
                size="sm"
            >
                <ModalContent className="dark:bg-[#1f1f1f] dark:text-white dark:border dark:border-white/10">
                    <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Discard Changes?</h3>
                    </ModalHeader>
                    <ModalBody className="py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You have unsaved changes. Are you sure you want to discard them?
                        </p>
                    </ModalBody>
                    <ModalFooter className="border-t border-gray-200 dark:border-white/5">
                        <Button
                            variant="light"
                            onPress={() => setCancelConfirmOpen(false)}
                            className="dark:text-white"
                        >
                            Keep Editing
                        </Button>
                        <Button
                            color="danger"
                            onPress={confirmCancelCreateForm}
                            className="font-semibold"
                        >
                            Discard
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Response Modal */}
            <Modal
                isOpen={viewResponseModalOpen}
                onClose={() => setViewResponseModalOpen(false)}
                size="full"
                scrollBehavior="inside"
                classNames={{
                    wrapper: 'items-stretch justify-end',
                    base: 'max-w-md m-0 h-screen rounded-none border-l border-gray-200',
                    body: 'p-6',
                    header: 'p-6 border-b border-gray-100',
                    footer: 'p-6 border-t border-gray-100',
                    backdrop: 'bg-black/50',
                }}
                motionProps={{
                    variants: {
                        enter: {
                            x: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: 'easeOut',
                            },
                        },
                        exit: {
                            x: "100%",
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: 'easeIn',
                            },
                        },
                    },
                }}
            >
            
                <ModalContent className="dark:bg-[#1f1f1f] dark:text-white dark:border dark:border-white/10">
                    <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Response Details</h3>
                        <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            ID: <span className="font-mono text-gray-700 dark:text-gray-300">{selectedResponse?.id}</span> • {selectedResponse ? new Date(selectedResponse.createdAt).toLocaleString() : ''}
                        </p>
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="space-y-6">
                            {selectedResponse?.answers?.map((ans: any) => (
                                <div key={ans.id} className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-800/20 p-4">
                                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {ans.question?.question || 'Unknown Question'}
                                    </p>
                                    <div className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800/50 p-3 text-sm text-gray-900 dark:text-white shadow-sm">
                                        {ans.answer ? (
                                            ans.answer.trim().startsWith('[') ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        try {
                                                            const parsed = JSON.parse(ans.answer);
                                                            return Array.isArray(parsed) ? parsed.map((item: string, idx: number) => (
                                                                <Chip key={idx} size="sm" variant="flat" color="primary">{item}</Chip>
                                                            )) : ans.answer;
                                                        } catch (e) {
                                                            return ans.answer;
                                                        }
                                                    })()}
                                                </div>
                                            ) : (
                                                ans.answer.replace(/^"|"$/g, '')
                                            )
                                        ) : (
                                            <span className="text-gray-400 italic">No answer provided</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                </ModalBody>
                <ModalFooter className='border-t border-gray-100 dark:border-white/5'>
                    <Button color="primary" onPress={() => setViewResponseModalOpen(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </div >
    )
}