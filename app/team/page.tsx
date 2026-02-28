"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";

type TeamMemberColor = "primary" | "secondary" | "warning" | "danger" | "success";

interface TeamMember {
  $id?: string;
  name: string;
  role: string;
  avatar: string;
  linkedin: string;
  github?: string;
  bio?: string;
  achievements?: string[];
  color: TeamMemberColor;
  isActive?: boolean;
}

// Hardcoded fallback data
const fallbackTeam: TeamMember[] = [
  {
    name: "Sarvesh Bhamare",
    role: "President & Founder",
    avatar: "https://media.licdn.com/dms/image/v2/D4D03AQEOBVyo_6WEfA/profile-displayphoto-scale_400_400/B4DZnXX7eLHsAg-/0/1760255005521?e=1764201600&v=beta&t=D5FnZeZbXTQKVBJHh9f2-oGyxKAKZVmDA30YB9qW0Hc",
    linkedin: "https://linkedin.com/in/sarveshbambare",
    github: "https://github.com/sarveshbhamare",
    bio: "Leading the community with vision and dedication to excellence.",
    achievements: ["Community Leadership", "Strategic Planning"],
    color: "secondary",
  },
  {
    name: "Vedant Wanzre",
    role: "Vice President",
    avatar: "https://media.licdn.com/dms/image/v2/D5635AQHH0c4L15sfqw/profile-framedphoto-shrink_400_400/B56Zfl.e.tHoAg-/0/1751910052068?e=1763359200&v=beta&t=MRb5sdffjPqrSXtsJ4wERO3a7Vi1el8G1qXtNG_RIck",
    linkedin: "https://linkedin.com/in/vedant-wanzare-85839a337",
    github: "https://github.com/vedantwanzare",
    bio: "Supporting organizational growth and member engagement.",
    achievements: ["Team Coordination", "Event Management"],
    color: "primary",
  },
  {
    name: "Gaurav Yadav",
    role: "Head of Technical Operations",
    avatar: "https://media.licdn.com/dms/image/v2/D5603AQFLDM_ENRFRCA/profile-displayphoto-scale_400_400/B56ZoNPY40KEAg-/0/1761158730093?e=1764201600&v=beta&t=O1px96p5cwLYnzpy-rTtjlL3nrvxvcUlhsQj1aXE1RY",
    linkedin: "https://linkedin.com/in/gurvv",
    github: "https://github.com/archduke1337",
    bio: "Driving technical innovation and infrastructure.",
    achievements: ["Technical Leadership", "System Architecture"],
    color: "warning",
  },
];

const colorOptions: TeamMemberColor[] = ["primary", "secondary", "warning", "danger", "success"];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch team from DB, fallback to hardcoded
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const data = await res.json();
          const members: TeamMember[] = (data.members || [])
            .filter((m: any) => m.isActive !== false)
            .map((m: any, i: number) => ({
              $id: m.$id,
              name: m.name,
              role: m.designation || m.role || "Member",
              avatar: m.avatar || m.image || "",
              linkedin: m.linkedin || "",
              github: m.github || "",
              bio: m.bio || "",
              achievements: m.skills ? (typeof m.skills === "string" ? m.skills.split(",").map((s: string) => s.trim()) : m.skills) : [],
              color: colorOptions[i % colorOptions.length],
              isActive: m.isActive,
            }));
          if (members.length > 0) {
            setTeam(members);
          } else {
            setTeam(fallbackTeam);
          }
        } else {
          setTeam(fallbackTeam);
        }
      } catch {
        setTeam(fallbackTeam);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const navigateTo = useCallback((newIndex: number) => {
    if (isTransitioning || newIndex === currentIndex || newIndex < 0 || newIndex >= team.length) {
      return;
    }
    setIsTransitioning(true);
    setDirection(newIndex > currentIndex ? "right" : "left");
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setDirection(null);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 50);
  }, [currentIndex, isTransitioning, team.length]);

  const goNext = useCallback(() => {
    navigateTo(currentIndex + 1);
  }, [currentIndex, navigateTo]);

  const goPrev = useCallback(() => {
    navigateTo(currentIndex - 1);
  }, [currentIndex, navigateTo]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      navigateTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      navigateTo(team.length - 1);
    }
  }, [goNext, goPrev, navigateTo, team.length]);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) goNext(); else goPrev();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, [goNext, goPrev]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTouchStart, handleTouchEnd, handleKeyDown]);

  const currentMember = team[currentIndex];

  const stats = useMemo(() => [
    { label: "Core Members", value: team.length.toString() },
    { label: "Community Size", value: "300+" },
  ], [team.length]);

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center w-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary" />
        <p className="mt-4 text-default-500 text-sm">Loading team...</p>
      </section>
    );
  }

  if (team.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center w-full min-h-screen">
        <p className="text-default-500">No team members found.</p>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col items-center justify-center w-full min-h-screen relative overflow-hidden py-6 sm:py-8 md:py-10 lg:py-12 px-3 sm:px-4 md:px-6"
      role="main"
      aria-label="Team Members Section"
    >
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-blue-50/30 dark:from-purple-950/5 dark:via-pink-950/5 dark:to-blue-950/5" />
      </div>

      <div className="w-full max-w-7xl">
        <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
          {/* Header */}
          <header className="text-center space-y-3 sm:space-y-4 md:space-y-5">
            <Chip color="secondary" variant="flat" size="md" className="text-xs sm:text-sm">
              Our Leadership
            </Chip>
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Meet Our Team
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-default-600 max-w-2xl mx-auto">
                Passionate individuals dedicated to building an extraordinary community
              </p>
            </div>
          </header>

          {/* Card Carousel */}
          <div
            className="relative"
            ref={containerRef}
            role="region"
            aria-label="Team member carousel"
            aria-live="polite"
          >
            <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
              <div className="relative h-80 sm:h-96 md:h-[420px] lg:h-[500px] perspective-1200">
                {team.map((member, index) => {
                  const position = index - currentIndex;
                  const isActive = position === 0;
                  const isVisible = Math.abs(position) <= 2;
                  if (!isVisible) return null;

                  const translateX = position * 8;
                  const translateY = Math.abs(position) * 12;
                  const scale = 1 - Math.abs(position) * 0.08;
                  const opacity = 1 - Math.abs(position) * 0.6;
                  const zIndex = 20 - Math.abs(position);
                  const blur = Math.abs(position) * 1.5;

                  const adjustedTranslateX = direction === 'right'
                    ? translateX - 20
                    : direction === 'left'
                    ? translateX + 20
                    : translateX;

                  return (
                    <div
                      key={member.$id || member.name}
                      className="absolute inset-0 transition-all duration-500 ease-out"
                      style={{
                        transform: `translateX(${adjustedTranslateX}px) translateY(${translateY}px) scale(${scale})`,
                        opacity: direction ? (isActive ? 0.3 : opacity) : opacity,
                        zIndex,
                        filter: `brightness(${isActive ? 1 : 0.7}) blur(${blur}px)`,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                      aria-hidden={!isActive}
                    >
                      <Card className="h-full border-none overflow-hidden" shadow="lg">
                        <CardBody className="p-4 sm:p-5 md:p-6 lg:p-8 relative overflow-hidden">
                          <div className="relative z-10 space-y-3 sm:space-y-4 md:space-y-5">
                            <div className="flex justify-center">
                              <Avatar
                                src={member.avatar}
                                alt={member.name}
                                className="w-20 sm:w-24 md:w-26 lg:w-28 h-20 sm:h-24 md:h-26 lg:h-28 text-large"
                                isBordered
                                color={member.color}
                                showFallback
                                name={member.name.split(" ").map(n => n[0]).join("")}
                              />
                            </div>

                            <div className="text-center space-y-1.5 sm:space-y-2">
                              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                                {member.name}
                              </h2>
                              <Chip
                                color={member.color}
                                variant="flat"
                                size="sm"
                                className="font-medium text-xs sm:text-sm"
                              >
                                {member.role}
                              </Chip>
                            </div>

                            {member.bio && (
                              <p className="text-center text-default-600 text-xs sm:text-sm md:text-base leading-relaxed min-h-[3rem]">
                                {member.bio}
                              </p>
                            )}

                            {member.achievements && member.achievements.length > 0 && (
                              <>
                                <Divider />
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                                  {member.achievements.map((achievement) => (
                                    <Chip
                                      key={achievement}
                                      size="sm"
                                      variant="bordered"
                                      color={member.color}
                                      className="text-xs"
                                    >
                                      {achievement}
                                    </Chip>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </CardBody>

                        <CardFooter className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 lg:p-8 pt-0">
                          <div className="flex justify-center gap-1.5 sm:gap-2 w-full">
                            {member.linkedin && (
                              <Button
                                isIconOnly as="a" href={member.linkedin} target="_blank"
                                rel="noopener noreferrer" variant="flat" color={member.color}
                                className="hover:scale-110 transition-transform" size="md"
                                aria-label={`View ${member.name}'s LinkedIn profile`}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                              </Button>
                            )}
                            {member.github && (
                              <Button
                                isIconOnly as="a" href={member.github} target="_blank"
                                rel="noopener noreferrer" variant="flat" color={member.color}
                                className="hover:scale-110 transition-transform" size="md"
                                aria-label={`View ${member.name}'s GitHub profile`}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                              </Button>
                            )}
                          </div>

                          {member.linkedin && (
                            <Button
                              as="a" href={member.linkedin} target="_blank"
                              rel="noopener noreferrer" color={member.color} size="md"
                              className="w-full font-medium"
                              endContent={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              }
                            >
                              Connect
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Instructions */}
            <div className="text-center mt-4 mb-6">
              <p className="text-xs md:text-sm text-default-500">
                Swipe or use arrow keys to navigate
              </p>
            </div>

            {/* Navigation Controls */}
            <nav className="flex items-center justify-center gap-4 md:gap-6" aria-label="Team member navigation">
              <Button
                isIconOnly color="secondary" variant="flat" onPress={goPrev}
                isDisabled={currentIndex === 0 || isTransitioning} size="sm"
                className="hover:scale-110 transition-transform disabled:opacity-30"
                aria-label="Previous team member"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>

              {/* Pagination Dots */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Team member pagination">
                {team.map((member, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(idx)}
                    disabled={isTransitioning}
                    className={`rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'h-2 w-10 bg-secondary'
                        : 'h-2 w-2 bg-default-300 hover:bg-default-400'
                    }`}
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`View ${member.name}`}
                  />
                ))}
              </div>

              <Button
                isIconOnly color="secondary" variant="flat" onPress={goNext}
                isDisabled={currentIndex === team.length - 1 || isTransitioning} size="sm"
                className="hover:scale-110 transition-transform disabled:opacity-30"
                aria-label="Next team member"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </nav>

            {/* Counter */}
            <div className="text-center mt-4">
              <p className="text-xs text-default-500">
                <span className="text-sm font-semibold text-foreground">{currentIndex + 1}</span>
                <span className="mx-1">/</span>
                <span>{team.length}</span>
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-none" shadow="sm">
                <CardBody className="text-center p-4">
                  <p className="text-2xl md:text-3xl font-bold text-secondary">{stat.value}</p>
                  <p className="text-xs md:text-sm text-default-600 mt-1">{stat.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1200 {
          perspective: 1200px;
        }
        @media (prefers-reduced-motion: reduce) {
          .transition-all {
            transition: none !important;
          }
          .perspective-1200 {
            perspective: none !important;
          }
        }
      `}</style>
    </section>
  );
}
