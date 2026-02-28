"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  TrophyIcon,
  ArrowLeftIcon,
  MedalIcon,
  UsersIcon,
  FileTextIcon,
  BarChart3Icon,
  ClockIcon,
  AwardIcon,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Submission {
  $id: string;
  teamId: string | null;
  userId: string;
  userName: string;
  projectTitle: string;
  projectDescription: string;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  status: string;
  totalScore: number;
  submittedAt: string;
}

const RANK_STYLES = [
  { bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "text-white", label: "🥇 1st Place" },
  { bg: "bg-gradient-to-br from-gray-300 to-gray-400", text: "text-white", label: "🥈 2nd Place" },
  { bg: "bg-gradient-to-br from-orange-400 to-orange-600", text: "text-white", label: "🥉 3rd Place" },
];

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    loadResults();
  }, [eventId]);

  const loadResults = async () => {
    try {
      const res = await fetch(
        `/api/hackathon/submissions?eventId=${eventId}`
      );
      const data = await res.json();
      const subs = (data.submissions || []) as Submission[];

      // Sort by totalScore descending
      subs.sort((a, b) => b.totalScore - a.totalScore);
      setSubmissions(subs);

      // Consider results published if at least one submission has a score > 0
      setIsPublished(subs.some((s) => s.totalScore > 0));
    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.back()}
        className="mb-6"
      >
        Back
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-warning" />
            Results Dashboard
          </h1>
          <p className="text-default-500 mt-1">
            {submissions.length} submissions • {isPublished ? "Results Published" : "Awaiting results"}
          </p>
        </div>
        {isPublished && (
          <Chip color="success" variant="flat" size="lg" className="font-semibold">
            ✅ Results Published
          </Chip>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="border-none shadow-md">
          <CardBody className="text-center p-4">
            <FileTextIcon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{submissions.length}</p>
            <p className="text-xs text-default-500">Total Submissions</p>
          </CardBody>
        </Card>
        <Card className="border-none shadow-md">
          <CardBody className="text-center p-4">
            <UsersIcon className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {new Set(submissions.map((s) => s.teamId || s.userId)).size}
            </p>
            <p className="text-xs text-default-500">Teams/Individuals</p>
          </CardBody>
        </Card>
        <Card className="border-none shadow-md">
          <CardBody className="text-center p-4">
            <BarChart3Icon className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {submissions.length > 0
                ? Math.round(submissions.reduce((a, s) => a + s.totalScore, 0) / submissions.length)
                : 0}
            </p>
            <p className="text-xs text-default-500">Avg Score</p>
          </CardBody>
        </Card>
        <Card className="border-none shadow-md">
          <CardBody className="text-center p-4">
            <AwardIcon className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {submissions.length > 0 ? submissions[0].totalScore : 0}
            </p>
            <p className="text-xs text-default-500">Highest Score</p>
          </CardBody>
        </Card>
      </div>

      {!isPublished ? (
        /* Awaiting Results State */
        <Card className="border-none shadow-lg">
          <CardBody className="text-center py-16">
            <ClockIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Results Not Yet Published</h2>
            <p className="text-default-500 max-w-md mx-auto mb-6">
              The organizers are reviewing submissions. Results and rankings will
              appear here once they are published.
            </p>
            {submissions.length > 0 && (
              <>
                <Divider className="my-6" />
                <h3 className="text-lg font-semibold mb-4">Submitted Projects</h3>
                <div className="space-y-3 max-w-2xl mx-auto text-left">
                  {submissions.map((sub) => (
                    <div
                      key={sub.$id}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-50 dark:bg-default-100/5"
                    >
                      <div>
                        <p className="font-semibold text-sm">{sub.projectTitle}</p>
                        <p className="text-xs text-default-500">{sub.userName}</p>
                      </div>
                      <Chip
                        size="sm"
                        color={sub.status === "submitted" ? "primary" : "success"}
                        variant="flat"
                      >
                        {sub.status}
                      </Chip>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Rankings */
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">🏆 Rankings</h2>

          {/* Top 3 Podium */}
          {submissions.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {submissions.slice(0, 3).map((sub, idx) => (
                <Card
                  key={sub.$id}
                  className={`border-none shadow-xl ${idx === 0 ? "sm:order-2 sm:-mt-4" : idx === 1 ? "sm:order-1" : "sm:order-3"}`}
                >
                  <CardBody className="text-center p-6">
                    <div
                      className={`w-16 h-16 rounded-full ${RANK_STYLES[idx]?.bg || "bg-default-200"} ${RANK_STYLES[idx]?.text || ""} flex items-center justify-center mx-auto mb-4 text-2xl font-bold`}
                    >
                      {idx + 1}
                    </div>
                    <p className="font-bold text-lg mb-1">{sub.projectTitle}</p>
                    <p className="text-sm text-default-500 mb-3">
                      {sub.userName}
                    </p>
                    <Chip color="warning" variant="flat" size="lg" className="font-bold">
                      Score: {sub.totalScore}
                    </Chip>
                    <p className="text-xs text-default-400 mt-2">
                      {RANK_STYLES[idx]?.label || `#${idx + 1}`}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Full Rankings Table */}
          <Card className="border-none shadow-lg">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-default-200">
                      <th className="text-left p-4 font-semibold text-default-500">#</th>
                      <th className="text-left p-4 font-semibold text-default-500">Project</th>
                      <th className="text-left p-4 font-semibold text-default-500">Team / Author</th>
                      <th className="text-left p-4 font-semibold text-default-500">Tech Stack</th>
                      <th className="text-right p-4 font-semibold text-default-500">Score</th>
                      <th className="text-center p-4 font-semibold text-default-500">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, idx) => (
                      <tr
                        key={sub.$id}
                        className={`border-b border-default-100 hover:bg-default-50 transition-colors ${idx < 3 ? "bg-warning-50/30 dark:bg-warning-900/10" : ""}`}
                      >
                        <td className="p-4 font-bold text-base">
                          {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : idx + 1}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{sub.projectTitle}</p>
                          <p className="text-xs text-default-500 line-clamp-1">
                            {sub.projectDescription}
                          </p>
                        </td>
                        <td className="p-4 text-default-600">{sub.userName}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {sub.techStack.slice(0, 3).map((t, i) => (
                              <Chip key={i} size="sm" variant="flat" className="text-xs">
                                {t}
                              </Chip>
                            ))}
                            {sub.techStack.length > 3 && (
                              <Chip size="sm" variant="flat" className="text-xs">
                                +{sub.techStack.length - 3}
                              </Chip>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-lg">{sub.totalScore}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-1 justify-center">
                            {sub.repoUrl && (
                              <Button
                                as="a"
                                href={sub.repoUrl}
                                target="_blank"
                                size="sm"
                                variant="flat"
                                isIconOnly
                              >
                                💻
                              </Button>
                            )}
                            {sub.demoUrl && (
                              <Button
                                as="a"
                                href={sub.demoUrl}
                                target="_blank"
                                size="sm"
                                variant="flat"
                                isIconOnly
                              >
                                🔗
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
