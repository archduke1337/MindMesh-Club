// lib/eventTemplates.ts
// Pre-built event templates for quick event creation

import { Event } from "./database";

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultEvent: Partial<Omit<Event, '$id' | '$createdAt' | '$updatedAt'>>;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "club-meetup",
    name: "Club Meetup",
    description: "Regular club gathering with members",
    icon: "🤝",
    defaultEvent: {
      title: "Club Meetup - [Month]",
      description: "Join us for our monthly club meetup in Pune. Great opportunity to network and discuss ideas.",
      image: "https://via.placeholder.com/1200x600?text=Club+Meetup",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "18:00",
      venue: "Pune Community Center",
      location: "Pune, Maharashtra, India",
      category: "forum",
      price: 0,
      discountPrice: null,
      capacity: 250,
      registered: 0,
      organizerName: "MindMesh Club",
      organizerAvatar: "https://via.placeholder.com/150",
      tags: ["networking", "community", "pune"],
      isFeatured: false,
      isPremium: false,
    },
  },
  {
    id: "workshop",
    name: "Workshop",
    description: "Interactive learning session",
    icon: "🎓",
    defaultEvent: {
      title: "Workshop: [Topic]",
      description: "Learn practical skills in this hands-on workshop. Limited seats available.",
      image: "https://via.placeholder.com/1200x600?text=Workshop",
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "14:00",
      venue: "Tech Hub Pune",
      location: "Pune, Maharashtra, India",
      category: "workshop",
      price: 299,
      discountPrice: null,
      capacity: 50,
      registered: 0,
      organizerName: "MindMesh Team",
      organizerAvatar: "https://via.placeholder.com/150",
      tags: ["learning", "skills", "hands-on"],
      isFeatured: false,
      isPremium: false,
    },
  },
  {
    id: "conference",
    name: "Conference",
    description: "Large-scale speaking event",
    icon: "🎤",
    defaultEvent: {
      title: "Conference [Year]: [Theme]",
      description: "Join industry leaders and innovators at our annual conference. Multi-track sessions, networking, and more.",
      image: "https://via.placeholder.com/1200x600?text=Conference",
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "09:00",
      venue: "Convention Center Pune",
      location: "Pune, Maharashtra, India",
      category: "conference",
      price: 999,
      discountPrice: 799,
      capacity: 500,
      registered: 0,
      organizerName: "MindMesh Events",
      organizerAvatar: "https://via.placeholder.com/150",
      tags: ["conference", "networking", "learning", "professionals"],
      isFeatured: true,
      isPremium: true,
    },
  },
  {
    id: "hackathon",
    name: "Hackathon",
    description: "Code competition and innovation event",
    icon: "💻",
    defaultEvent: {
      title: "Hackathon [Year]: [Theme]",
      description: "Build innovative solutions in 24 hours. Compete for prizes and recognition.",
      image: "https://via.placeholder.com/1200x600?text=Hackathon",
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "10:00",
      venue: "Innovation Lab Pune",
      location: "Pune, Maharashtra, India",
      category: "competition",
      price: 0,
      discountPrice: null,
      capacity: 200,
      registered: 0,
      organizerName: "MindMesh Developers",
      organizerAvatar: "https://via.placeholder.com/150",
      tags: ["hackathon", "coding", "innovation", "competition"],
      isFeatured: true,
      isPremium: false,
    },
  },
  {
    id: "masterclass",
    name: "Masterclass",
    description: "Expert-led advanced training",
    icon: "⭐",
    defaultEvent: {
      title: "Masterclass: [Expert Name] - [Topic]",
      description: "Learn directly from industry experts. Limited to 30 participants for personalized attention.",
      image: "https://via.placeholder.com/1200x600?text=Masterclass",
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: "19:00",
      venue: "Learning Studio Pune",
      location: "Pune, Maharashtra, India",
      category: "masterclass",
      price: 1499,
      discountPrice: 999,
      capacity: 30,
      registered: 0,
      organizerName: "MindMesh Academy",
      organizerAvatar: "https://via.placeholder.com/150",
      tags: ["masterclass", "expert", "premium", "limited"],
      isFeatured: true,
      isPremium: true,
    },
  },
];

export function getTemplateById(id: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateEvent(templateId: string): Partial<Omit<Event, '$id' | '$createdAt' | '$updatedAt'>> | null {
  const template = getTemplateById(templateId);
  return template ? template.defaultEvent : null;
}
