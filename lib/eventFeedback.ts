// lib/eventFeedback.ts
/**
 * Event Feedback & Survey Utilities
 * Provides functions for collecting post-event feedback and surveys
 */

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple-choice' | 'yes-no';
  required: boolean;
  options?: string[]; // For multiple-choice
}

export interface EventFeedback {
  eventId: string;
  attendeeEmail: string;
  attendeeName?: string;
  submittedAt: string;
  answers: {
    [questionId: string]: string | number;
  };
  overallRating: number;
  comments?: string;
}

/**
 * Default feedback survey questions
 */
export const DEFAULT_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 'overall_experience',
    question: 'How would you rate your overall experience?',
    type: 'rating',
    required: true
  },
  {
    id: 'content_quality',
    question: 'How relevant and useful was the content?',
    type: 'rating',
    required: true
  },
  {
    id: 'speaker_quality',
    question: 'How would you rate the speaker(s)?',
    type: 'rating',
    required: false
  },
  {
    id: 'venue_experience',
    question: 'How would you rate the venue and facilities?',
    type: 'rating',
    required: false
  },
  {
    id: 'networking_opportunity',
    question: 'Did you have good networking opportunities?',
    type: 'yes-no',
    required: false
  },
  {
    id: 'would_attend_again',
    question: 'Would you attend a similar event in the future?',
    type: 'yes-no',
    required: false
  },
  {
    id: 'improvement_areas',
    question: 'What could be improved for the next event?',
    type: 'text',
    required: false
  },
  {
    id: 'topic_suggestions',
    question: 'Do you have suggestions for future event topics?',
    type: 'text',
    required: false
  }
];

/**
 * Minimal feedback survey (quick version)
 */
export const QUICK_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 'overall_rating',
    question: 'Rate this event (1-5 stars)',
    type: 'rating',
    required: true
  },
  {
    id: 'would_recommend',
    question: 'Would you recommend this event to others?',
    type: 'yes-no',
    required: true
  },
  {
    id: 'feedback',
    question: 'Any additional feedback?',
    type: 'text',
    required: false
  }
];

/**
 * Advanced feedback survey (comprehensive version)
 */
export const ADVANCED_FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  ...DEFAULT_FEEDBACK_QUESTIONS,
  {
    id: 'accessibility_experience',
    question: 'Was the event accessible to you?',
    type: 'yes-no',
    required: false
  },
  {
    id: 'pricing_value',
    question: 'Did the event offer good value for money?',
    type: 'rating',
    required: false
  },
  {
    id: 'promotion_channel',
    question: 'How did you hear about this event?',
    type: 'multiple-choice',
    required: false,
    options: ['Social Media', 'Email', 'Word of Mouth', 'Search Engine', 'Website', 'Other']
  }
];

/**
 * Generate feedback survey URL (for embedded forms like Typeform)
 */
export function generateFeedbackFormUrl(
  eventId: string,
  attendeeEmail: string,
  externalFormId?: string
): string {
  const params = new URLSearchParams({
    event_id: eventId,
    email: attendeeEmail
  });

  // If using external form service (like Typeform, Google Forms)
  if (externalFormId) {
    return `https://form.typeform.com/to/${externalFormId}?${params.toString()}`;
  }

  // Otherwise return internal feedback form URL
  return `/feedback?${params.toString()}`;
}

/**
 * Create feedback survey email content
 */
export function generateFeedbackEmailContent(
  eventTitle: string,
  attendeeName: string,
  feedbackUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Share Your Feedback - ${eventTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Thank You for Attending!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">${eventTitle}</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${attendeeName},</p>
        
        <p>We're thrilled you attended our event! Your feedback is incredibly valuable and helps us improve future events.</p>
        
        <p>Would you mind taking 2-3 minutes to share your thoughts?</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackUrl}" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
            Share Your Feedback
          </a>
        </div>
        
        <p>Your responses are completely anonymous and will be used only to improve our events.</p>
        
        <p>Best regards,<br>The Event Team</p>
      </div>
      
      <div style="padding: 20px; background: #f0f0f0; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; text-align: center;">
        <p>© ${new Date().getFullYear()} MindMesh Events. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Thank You for Attending ${eventTitle}!

Hi ${attendeeName},

We're thrilled you attended our event! Your feedback is incredibly valuable and helps us improve future events.

Would you mind taking 2-3 minutes to share your thoughts?

${feedbackUrl}

Your responses are completely anonymous and will be used only to improve our events.

Best regards,
The Event Team
  `.trim();

  return { subject, html, text };
}

/**
 * Calculate feedback statistics
 */
export function calculateFeedbackStats(feedbacks: EventFeedback[]) {
  if (!feedbacks.length) {
    return {
      totalResponses: 0,
      averageRating: 0,
      responseRate: 0,
      satisfactionScore: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      commonThemes: [],
      sentiment: 'neutral'
    };
  }

  const totalResponses = feedbacks.length;
  const ratings = feedbacks
    .map(f => f.overallRating)
    .filter(r => r > 0);

  const averageRating = ratings.length > 0
    ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
    : 0;

  const ratingDistribution = {
    5: feedbacks.filter(f => f.overallRating === 5).length,
    4: feedbacks.filter(f => f.overallRating === 4).length,
    3: feedbacks.filter(f => f.overallRating === 3).length,
    2: feedbacks.filter(f => f.overallRating === 2).length,
    1: feedbacks.filter(f => f.overallRating === 1).length,
  };

  const satisfactionScore = ratings.length > 0
    ? Math.round((ratings.filter(r => r >= 4).length / ratings.length) * 100)
    : 0;

  // Determine sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (averageRating > 3.5) sentiment = 'positive';
  else if (averageRating < 2.5) sentiment = 'negative';

  return {
    totalResponses,
    averageRating,
    satisfactionScore,
    ratingDistribution,
    sentiment
  };
}

/**
 * Generate feedback report
 */
export function generateFeedbackReport(
  eventTitle: string,
  feedbacks: EventFeedback[]
) {
  const stats = calculateFeedbackStats(feedbacks);

  return `
EVENT FEEDBACK REPORT
=====================
Event: ${eventTitle}
Generated: ${new Date().toLocaleDateString()}

SUMMARY STATISTICS
------------------
Total Responses: ${stats.totalResponses}
Average Rating: ${stats.averageRating}/5
Satisfaction Score: ${stats.satisfactionScore}%
Sentiment: ${stats.sentiment}

RATING DISTRIBUTION
-------------------
⭐⭐⭐⭐⭐ (5 stars): ${stats.ratingDistribution[5]} responses
⭐⭐⭐⭐ (4 stars): ${stats.ratingDistribution[4]} responses
⭐⭐⭐ (3 stars): ${stats.ratingDistribution[3]} responses
⭐⭐ (2 stars): ${stats.ratingDistribution[2]} responses
⭐ (1 star): ${stats.ratingDistribution[1]} responses

KEY INSIGHTS
------------
- ${stats.satisfactionScore}% of attendees would rate this event as very good or excellent
- Response rate: ${feedbacks.length} feedback submissions received
- Overall trend: ${stats.sentiment === 'positive' ? 'Very positive feedback!' : stats.sentiment === 'negative' ? 'Needs improvement' : 'Mixed feedback'}

RECOMMENDATIONS
---------------
${stats.averageRating < 3 ? '⚠️ Low ratings detected - Review event quality and format\n' : ''}
${stats.satisfactionScore < 50 ? '⚠️ Less than 50% satisfied - Consider major changes\n' : ''}
${stats.ratingDistribution[5] > (stats.totalResponses / 2) ? '✅ Strong positive feedback - Repeat similar format\n' : ''}
${stats.satisfactionScore > 80 ? '✅ High satisfaction - Great event execution!\n' : ''}
  `.trim();
}

/**
 * Export feedback to CSV
 */
export function generateFeedbackCSV(eventTitle: string, feedbacks: EventFeedback[]): string {
  if (!feedbacks.length) {
    return 'No feedback data available';
  }

  const headers = [
    'Submitted At',
    'Attendee Email',
    'Attendee Name',
    'Overall Rating',
    'Comments'
  ];

  const rows = feedbacks.map(feedback => [
    feedback.submittedAt,
    feedback.attendeeEmail,
    feedback.attendeeName || 'N/A',
    feedback.overallRating,
    `"${(feedback.comments || '').replace(/"/g, '""')}"`
  ]);

  const csv = [
    `Event Feedback - ${eventTitle}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}

/**
 * Download feedback CSV
 */
export function downloadFeedbackCSV(eventTitle: string, feedbacks: EventFeedback[]): void {
  const csv = generateFeedbackCSV(eventTitle, feedbacks);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${eventTitle}-feedback-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
