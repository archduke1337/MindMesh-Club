// lib/events/types/bootcamp.config.ts
import { EventTypeConfig, DETAIL_SECTIONS, ADMIN_TABS } from "../types";

export const bootcampConfig: EventTypeConfig = {
  type: "bootcamp",
  label: "Bootcamp",
  description: "Multi-day intensive training program with curriculum, assignments, and progress tracking. Covers crash courses, intensive workshops, and deep-dive training sessions.",
  icon: "GraduationCap",
  color: "from-indigo-500 to-blue-700",

  capacityModel: "cohort",
  defaultCapacity: 30,

  registration: {
    model: "application",
    requiresApproval: true,
    allowTeams: false,
    extraFields: [
      {
        name: "motivation",
        label: "Why do you want to join?",
        type: "textarea",
        required: true,
        placeholder: "Tell us why you're interested and what you hope to learn",
      },
      {
        name: "background",
        label: "Your Background / Experience",
        type: "textarea",
        required: true,
        placeholder: "Relevant skills, courses, or projects",
      },
      {
        name: "availableAllDays",
        label: "I can attend all scheduled days",
        type: "checkbox",
        required: true,
        helpText: "Bootcamps require full attendance for completion certificate",
      },
      {
        name: "portfolioUrl",
        label: "Portfolio / GitHub Link",
        type: "url",
        required: false,
        placeholder: "https://github.com/yourprofile",
      },
    ],
  },

  ticket: {
    template: "enrollment",
    fields: ["name", "cohort", "curriculum", "schedule", "venue", "mentorInfo"],
    hasQRCode: true,
    hasCheckIn: true,
    checkInModel: "daily",
  },

  pricing: {
    model: "per-person",
    defaultFree: false,
    supportsEarlyBird: true,
    supportsCoupons: true,
    supportsInstallments: true,
  },

  features: {
    teams: false,
    rounds: false,
    submissions: true,  // assignments
    judging: false,
    leaderboard: false,
    materials: true,
    speakers: true,     // instructors
    schedule: true,
    certificates: true,
    streaming: false,
    qna: false,
    attendance: true,
    mentors: true,
    prizes: false,
    subEvents: false,
    problemStatements: false,
    voting: false,
    forum: false,
  },

  detailSections: [
    DETAIL_SECTIONS.OVERVIEW,
    DETAIL_SECTIONS.SCHEDULE,
    DETAIL_SECTIONS.SPEAKERS,
    DETAIL_SECTIONS.MATERIALS,
    DETAIL_SECTIONS.MENTORS,
    DETAIL_SECTIONS.REGISTRATION,
    DETAIL_SECTIONS.VENUE,
    DETAIL_SECTIONS.FAQ,
    DETAIL_SECTIONS.CONTACT,
  ],

  adminTabs: [
    ADMIN_TABS.OVERVIEW,
    ADMIN_TABS.APPLICATIONS,
    ADMIN_TABS.REGISTRATIONS,
    ADMIN_TABS.CHECK_IN,
    ADMIN_TABS.ATTENDANCE,
    ADMIN_TABS.SCHEDULE,
    ADMIN_TABS.SPEAKERS,
    ADMIN_TABS.MATERIALS,
    ADMIN_TABS.SUBMISSIONS,    // assignments
    ADMIN_TABS.MENTORS,
    ADMIN_TABS.CERTIFICATES,
    ADMIN_TABS.FEEDBACK,
    ADMIN_TABS.ANALYTICS,
    ADMIN_TABS.EXPORT,
    ADMIN_TABS.SETTINGS,
  ],

  postEvent: {
    hasResults: false,
    hasCertificates: true,
    hasFeedback: true,
    hasGallery: true,
    hasRecording: false,
    hasResourceSharing: true,
  },

  extraEventFields: [
    {
      name: "bootcampTopic",
      label: "Bootcamp Topic",
      type: "select",
      required: true,
      options: [
        { value: "full-stack", label: "Full-Stack Development" },
        { value: "frontend", label: "Frontend Development" },
        { value: "backend", label: "Backend Development" },
        { value: "machine-learning", label: "Machine Learning / AI" },
        { value: "data-science", label: "Data Science & Analytics" },
        { value: "mobile-dev", label: "Mobile App Development" },
        { value: "devops", label: "DevOps & Cloud" },
        { value: "cybersecurity", label: "Cybersecurity" },
        { value: "blockchain", label: "Blockchain / Web3" },
        { value: "dsa", label: "Data Structures & Algorithms" },
        { value: "competitive-programming", label: "Competitive Programming" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "durationDays",
      label: "Duration (Days)",
      type: "number",
      required: true,
      placeholder: "5",
    },
    {
      name: "dailySchedule",
      label: "Daily Schedule",
      type: "textarea",
      required: false,
      placeholder: "e.g., 10am-1pm: Theory | 2pm-5pm: Hands-on | 5pm-6pm: Doubt clearing",
    },
    {
      name: "curriculum",
      label: "Curriculum / Syllabus",
      type: "textarea",
      required: true,
      placeholder: "Day-by-day breakdown of topics covered",
    },
    {
      name: "prerequisites",
      label: "Prerequisites",
      type: "textarea",
      required: false,
      placeholder: "What participants should know before joining",
    },
    {
      name: "cohortSize",
      label: "Cohort Size",
      type: "number",
      required: true,
      placeholder: "30",
      helpText: "Max participants for this batch",
    },
    {
      name: "hasScholarship",
      label: "Scholarship / Free Spots Available",
      type: "checkbox",
      required: false,
    },
    {
      name: "completionCriteria",
      label: "Completion Criteria",
      type: "textarea",
      required: false,
      placeholder: "e.g., Attend 80%+ sessions, submit final project",
      helpText: "What's needed to get the completion certificate",
    },
  ],
};
