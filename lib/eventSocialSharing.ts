// lib/eventSocialSharing.ts
/**
 * Event Social Sharing Utilities
 * Provides functions for social media sharing, email sharing, and sharing via other channels
 */

import { Event } from "@/lib/database";

export interface SocialShareOptions {
  url: string;
  title: string;
  description: string;
  hashtags?: string[];
  image?: string;
}

/**
 * Generate event sharing URL
 */
export function getEventShareUrl(eventId: string, baseUrl = typeof window !== 'undefined' ? window.location.origin : ''): string {
  return `${baseUrl}/events/${eventId}`;
}

/**
 * Share event to LinkedIn
 */
export function shareToLinkedIn(event: Event): void {
  const url = getEventShareUrl(event.$id!);
  const text = `🎉 Excited to attend: ${event.title}
📅 ${new Date(event.date).toLocaleDateString()}
📍 ${event.location}

${event.description.substring(0, 100)}...

Join me! #events`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(event.title)}&summary=${encodeURIComponent(text)}`;
  window.open(linkedInUrl, 'linkedin-share', 'width=550,height=400');
}

/**
 * Share event to Twitter
 */
export function shareToTwitter(event: Event): void {
  const url = getEventShareUrl(event.$id!);
  const text = `🎉 ${event.title}
📅 ${new Date(event.date).toLocaleDateString()}
📍 ${event.location}
💰 ${event.price === 0 ? 'FREE' : `₹${event.price}`}

#events #${event.category}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, 'twitter-share', 'width=550,height=400');
}

/**
 * Share event to Instagram (opens app, requires manual share)
 */
export function shareToInstagram(event: Event): void {
  // Instagram doesn't have a direct share URL like Twitter/LinkedIn
  // Instead, we'll copy to clipboard and show instructions
  const shareText = `🎉 ${event.title}
📅 ${new Date(event.date).toLocaleDateString()}
📍 ${event.location}

${getEventShareUrl(event.$id!)}

#events #${event.category}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
    alert("Event details copied to clipboard! Open Instagram and paste in your story.");
  } else {
    alert(`Event: ${event.title}\n\n${shareText}`);
  }
}

/**
 * Share event via Email
 */
export function shareViaEmail(event: Event): void {
  const url = getEventShareUrl(event.$id!);
  const subject = `Check out: ${event.title}`;
  const body = `Hi!\n\nI wanted to invite you to this amazing event:\n\n${event.title}\n\nDate: ${new Date(event.date).toLocaleDateString()}\nTime: ${event.time}\nLocation: ${event.location}\n\nPrice: ${event.price === 0 ? 'FREE' : `₹${event.price}`}\n\nDescription:\n${event.description}\n\nRegister here: ${url}\n\nHope to see you there!`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);
}

/**
 * Share event via WhatsApp (if available)
 */
export function shareViaWhatsApp(event: Event): void {
  const url = getEventShareUrl(event.$id!);
  const text = `🎉 ${event.title}
📅 ${new Date(event.date).toLocaleDateString()}
📍 ${event.location}
${url}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, 'whatsapp-share');
}

/**
 * Share event via Telegram
 */
export function shareViaTelegram(event: Event): void {
  const url = getEventShareUrl(event.$id!);
  const text = `🎉 ${event.title}
📅 ${new Date(event.date).toLocaleDateString()}
📍 ${event.location}
${url}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, 'telegram-share');
}

/**
 * Copy event link to clipboard
 */
export async function copyEventLinkToClipboard(event: Event): Promise<boolean> {
  try {
    const url = getEventShareUrl(event.$id!);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Generate shareable text for various platforms
 */
export function generateShareableText(event: Event, platform: 'twitter' | 'linkedin' | 'generic'): string {
  const date = new Date(event.date).toLocaleDateString();
  const baseText = `🎉 ${event.title}\n📅 ${date}\n📍 ${event.location}`;

  switch (platform) {
    case 'twitter':
      return `${baseText}\n💰 ${event.price === 0 ? 'FREE' : `₹${event.price}`}\n#events #${event.category}`;

    case 'linkedin':
      return `${baseText}\n\n${event.description.substring(0, 200)}...\n\nLooking forward to this! #events`;

    case 'generic':
    default:
      return `${baseText}\n\n${event.description}`;
  }
}

/**
 * Get all social sharing options for an event
 */
export function getEventSocialShareLinks(event: Event) {
  const url = getEventShareUrl(event.$id!);
  const title = event.title;
  const description = event.description;

  return {
    linkedin: {
      label: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: 'linkedin'
    },
    twitter: {
      label: 'Twitter/X',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareableText(event, 'twitter'))}&url=${encodeURIComponent(url)}`,
      icon: 'twitter'
    },
    facebook: {
      label: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: 'facebook'
    },
    whatsapp: {
      label: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
      icon: 'whatsapp'
    },
    telegram: {
      label: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: 'send'
    },
    email: {
      label: 'Email',
      url: `mailto:?subject=${encodeURIComponent(`Check out: ${title}`)}&body=${encodeURIComponent(description)}`,
      icon: 'mail'
    }
  };
}

/**
 * Open social share in new window with standard dimensions
 */
export function openSocialWindow(url: string, platform: string): Window | null {
  return window.open(url, `${platform}-share`, 'width=600,height=400,left=200,top=200');
}

/**
 * Track social shares (for analytics)
 */
export function trackSocialShare(eventId: string, platform: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share_event', {
      event_id: eventId,
      platform: platform
    });
  }

  // Log to console for verification
  console.log(`Event shared to ${platform}:`, eventId);
}
