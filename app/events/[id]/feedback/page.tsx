"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Divider } from "@heroui/divider";
import {
  MessageCircleIcon,
  StarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SendIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function FeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (!feedback.trim()) {
      setError("Please share your feedback");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          userId: user.$id,
          userName: user.name,
          userEmail: user.email,
          rating,
          feedback: feedback.trim(),
          suggestions: suggestions.trim() || null,
          category: "event",
          isAnonymous: false,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit feedback");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Thank You!</h1>
        <p className="text-default-500 mb-8">
          Your feedback helps us improve future events.
        </p>
        <Button color="primary" onPress={() => router.push("/events")}>
          Browse Events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.back()}
        className="mb-6"
      >
        Back
      </Button>

      <Card className="border-none shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2 pt-8 px-6">
          <MessageCircleIcon className="w-12 h-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-center">Event Feedback</h1>
          <p className="text-sm text-default-500 text-center">
            Help us improve by sharing your experience
          </p>
        </CardHeader>

        <Divider className="my-4" />

        <CardBody className="px-6 pb-8 space-y-6">
          {error && (
            <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-semibold text-default-600 mb-3">
              How would you rate this event? *
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-default-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-default-400 mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </p>
            )}
          </div>

          <Textarea
            label="Your Feedback *"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setError("");
            }}
            variant="bordered"
            placeholder="What did you like or dislike about the event?"
            minRows={4}
          />

          <Textarea
            label="Suggestions for Improvement (optional)"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            variant="bordered"
            placeholder="How could we make future events better?"
            minRows={3}
          />

          <Button
            color="primary"
            size="lg"
            className="w-full font-bold"
            onPress={handleSubmit}
            isLoading={submitting}
            startContent={<SendIcon className="w-4 h-4" />}
          >
            Submit Feedback
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
