"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Trophy, ArrowLeft } from "lucide-react";
import { InlineMath, BlockMath } from "react-katex";
import MarkdownIt from "markdown-it";
import apiClient from "@/lib/api/client";

// Import KaTeX CSS
import "katex/dist/katex.min.css";

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Simple shuffle function using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Function to render markdown with LaTeX support
const renderMarkdownWithLatex = (content: string): React.ReactNode => {
  if (!content) return null;

  // Split content by LaTeX patterns first
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return parts.map((part, index) => {
    // Display math
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const formula = part.slice(2, -2);
      return (
        <span key={index} className="inline-block mx-1">
          <BlockMath math={formula} />
        </span>
      );
    }
    // Inline math
    else if (part.startsWith("$") && part.endsWith("$")) {
      const formula = part.slice(1, -1);
      return (
        <span key={index} className="inline-block mx-1">
          <InlineMath math={formula} />
        </span>
      );
    }
    // Regular text/markdown
    else {
      // Render markdown and remove wrapping p tags to keep everything inline
      const rendered = md.render(part).trim();
      const inlineHtml = rendered.replace(/^<p>|<\/p>$/g, "");
      return (
        <span key={index} dangerouslySetInnerHTML={{ __html: inlineHtml }} />
      );
    }
  });
};

interface Question {
  id: string;
  type: "ABCD" | "TRUEFALSE" | "NUMBER" | "ESSAY" | "abcd" | string;
  question: string;
  choices?: string[];
  options?: Array<{ text: string }> | string[];
  correctAnswer: string | number | boolean;
  correct?: string;
  points: number;
  explanation?: string;
  image?: string;
  imageUrl?: string;
  image_url?: string;
}

interface ResultQuestion {
  questionId: string;
  answer: string | number | boolean;
  type: string;
  points: number;
  earnedPoints: number;
  isCorrect: boolean;
  lessonQuestion?: Question;
}

interface Lesson {
  id: string;
  title: string;
  questions: Question[];
}

interface Result {
  id: string;
  lesson_id: string;
  student_id: string;
  score: number;
  total_points: number;
  timestamp: string;
  questions: ResultQuestion[];
  student_info: {
    id: string;
    username: string;
  };
  time_taken: number;
  mode: string;
  lesson?: Lesson;
  lesson_title?: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortFilter, setSortFilter] = useState<"all" | "correct" | "incorrect">(
    "all",
  );
  const [explanations, setExplanations] = useState<{ [key: string]: string }>(
    {},
  );
  const [loadingExplanations, setLoadingExplanations] = useState<{
    [key: string]: boolean;
  }>({});
  const [collapsedExplanations, setCollapsedExplanations] = useState<{
    [key: string]: boolean;
  }>({});
  const [explainErrors, setExplainErrors] = useState<{ [key: string]: string }>(
    {},
  );

  useEffect(() => {
    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/results/${resultId}`);

      if (response.data.success && response.data.data.result) {
        // console.log("Result data:", response.data.data.result);
        setResult(response.data.data.result);
      } else {
        setError("Result not found");
      }
    } catch (err: any) {
      console.error("Error fetching result:", err);
      if (err.response?.status === 404) {
        setError("Result not found");
      } else if (err.response?.status === 401) {
        setError("Authentication required");
        router.push("/login");
      } else if (err.response?.status === 403) {
        setError("Access denied: can only access own results");
      } else {
        setError("Failed to load result. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExplainQuestion = async (
    questionId: string,
    question: string,
    answer: string,
    existingExplanation?: string,
  ) => {
    const key = `question_${questionId}`;
    setLoadingExplanations((prev) => ({ ...prev, [key]: true }));
    setExplainErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      const response = await apiClient.post("/explain", {
        question,
        answer,
        explanation: existingExplanation,
      });

      if (response.data.success) {
        setExplanations((prev) => ({
          ...prev,
          [key]: response.data.data.explanation,
        }));
        setCollapsedExplanations((prev) => ({ ...prev, [key]: false }));
      } else {
        setExplainErrors((prev) => ({
          ...prev,
          [key]: response.data.message || "Failed to generate explanation",
        }));
      }
    } catch (error: any) {
      console.error("Error getting explanation:", error);
      if (error.response?.status === 500) {
        setExplainErrors((prev) => ({
          ...prev,
          [key]: "AI service unavailable",
        }));
      } else {
        setExplainErrors((prev) => ({
          ...prev,
          [key]: "Failed to generate explanation",
        }));
      }
    } finally {
      setLoadingExplanations((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleExplanationCollapse = (questionId: string) => {
    const key = `question_${questionId}`;
    setCollapsedExplanations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFilteredQuestions = () => {
    if (!result?.questions) return [];

    // Handle both formats: new format (with lesson data) and old format (standalone questions)
    const questionsWithDetails = result.questions.map(
      (resultQ: any, index: number) => {
        // For data with lesson information
        if (result.lesson?.questions) {
          // First try to match by ID
          let lessonQ = result.lesson.questions.find(
            (lq: any) => lq.id === resultQ.questionId,
          );

          // If no match by ID, try to match by index as fallback
          if (!lessonQ && result.lesson.questions[index]) {
            lessonQ = result.lesson.questions[index];
            console.log(`Using index-based matching for question ${index}`);
          }

          if (lessonQ) {
            // Normalize the lesson question format
            const normalizedLessonQ = {
              id: lessonQ.id,
              type: lessonQ.type?.toUpperCase() || "ABCD",
              question: lessonQ.question,
              // Convert options array of objects to simple string array
              choices: lessonQ.options
                ? lessonQ.options.map((opt: any) =>
                    typeof opt === "string" ? opt : opt.text,
                  )
                : lessonQ.choices || [],
              // Preserve original options for TRUEFALSE questions
              options: lessonQ.options,
              correct: lessonQ.correct,
              correctAnswer: lessonQ.correct || lessonQ.correctAnswer,
              points: lessonQ.points || 0,
              explanation: lessonQ.explanation || "",
              image: lessonQ.image || lessonQ.imageUrl || lessonQ.image_url,
            };
            return { ...resultQ, lessonQuestion: normalizedLessonQ };
          }
        }

        // For real database format (questions have all data inline)
        // The real data has the question text and options embedded in the result
        const normalizedQuestion = {
          ...resultQ,
          lessonQuestion: {
            id: resultQ.questionId || `q${index + 1}`,
            type: resultQ.type?.toUpperCase() || "ABCD",
            question: resultQ.question || resultQ.questionText || "",
            choices: resultQ.optionsText || resultQ.choices || [],
            options: resultQ.options,
            correct: resultQ.correct,
            correctAnswer: resultQ.correctAnswer || resultQ.correct || "N/A",
            points: resultQ.points || 0,
            explanation: resultQ.explanation || "",
            image:
              resultQ.imageUrl ||
              resultQ.image ||
              resultQ.questionImage ||
              resultQ.question_image,
          },
          // Make sure answer is available at the top level
          answer: resultQ.userAnswer || resultQ.answer,
        };

        console.log(`Question ${index}:`, {
          ...normalizedQuestion,
          imageUrl: resultQ.imageUrl,
          image: resultQ.image,
          questionImage: resultQ.questionImage,
          question_image: resultQ.question_image,
          allFields: Object.keys(resultQ),
        });

        return normalizedQuestion;
      },
    );

    // Apply filter first
    let filteredQuestions = questionsWithDetails;
    switch (sortFilter) {
      case "correct":
        filteredQuestions = questionsWithDetails.filter((q) => q.isCorrect);
        break;
      case "incorrect":
        filteredQuestions = questionsWithDetails.filter((q) => !q.isCorrect);
        break;
      default:
        filteredQuestions = questionsWithDetails;
    }

    return filteredQuestions;
  };

  const renderChoice = (
    choice: string,
    index: number,
    question: any,
    resultQuestion: any,
  ) => {
    const choiceLabel = String.fromCharCode(65 + index); // A, B, C, D

    // Use gray border for all choices
    let className =
      "relative flex items-start px-3 py-2 rounded-md border text-sm transition-all bg-white border-gray-200";

    // Extract image from choice text if present
    const imageMatch = choice.match(/\[img\s+src="([^"]+)"\]/);
    const textWithoutImage = imageMatch
      ? choice.replace(imageMatch[0], "").trim()
      : choice;

    return (
      <div
        key={choiceLabel}
        data-testid={`choice-${choiceLabel}`}
        className={className}
      >
        <span className="font-medium mr-3 flex-shrink-0">{choiceLabel}</span>
        <div className="flex-1 whitespace-normal break-words">
          <div>{renderMarkdownWithLatex(textWithoutImage)}</div>
          {imageMatch && imageMatch[1] && (
            <div className="mt-2">
              <img
                src={imageMatch[1]}
                alt="Choice image"
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error("Failed to load choice image:", imageMatch[1]);
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrueFalseAnswer = (resultQuestion: any) => {
    const lessonQuestion = resultQuestion.lessonQuestion;

    // Check if this is a multi-statement true/false question
    if (
      lessonQuestion?.options &&
      Array.isArray(lessonQuestion.options) &&
      lessonQuestion.options.length > 1
    ) {
      // Multi-statement true/false
      const userAnswersObj = resultQuestion.answer || {};
      const correctAnswers = lessonQuestion.correct || [];

      // Convert answer object {"A": true, "B": false, ...} to array [true, false, ...]
      const userAnswers = Array.isArray(userAnswersObj)
        ? userAnswersObj
        : ["A", "B", "C", "D"].map((key, index) =>
            index < lessonQuestion.options.length
              ? userAnswersObj[key]
              : undefined,
          );

      return (
        <div className="space-y-3">
          {lessonQuestion.options.map((option: any, index: number) => {
            const statement = typeof option === "string" ? option : option.text;
            const isCorrect = correctAnswers[index] === true;
            const userAnswer = userAnswers[index];
            const hasAnswer = userAnswer !== null && userAnswer !== undefined;

            return (
              <div key={index} className="space-y-1">
                <div className="text-sm mb-1">
                  {renderMarkdownWithLatex(statement)}
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className={`px-3 py-1 rounded border text-sm ${
                      isCorrect
                        ? "border-green-500 bg-green-50"
                        : hasAnswer && userAnswer === true && !isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white"
                    }`}
                  >
                    Đúng
                  </div>
                  <div
                    className={`px-3 py-1 rounded border text-sm ${
                      !isCorrect
                        ? "border-green-500 bg-green-50"
                        : hasAnswer && userAnswer === false && isCorrect
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white"
                    }`}
                  >
                    Sai
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Single true/false question
      const userAnswer = resultQuestion.userAnswer || resultQuestion.answer;
      const correctAnswer = lessonQuestion?.correctAnswer;
      const hasAnswer =
        userAnswer !== null &&
        userAnswer !== undefined &&
        userAnswer !== "No answer";

      return (
        <div className="space-y-1">
          <div
            data-testid="answer-true"
            className={`p-2 rounded-md border text-sm transition-colors bg-white ${
              correctAnswer === true ? "border-green-500" : "border-gray-200"
            }`}
          >
            Đúng
          </div>
          <div
            data-testid="answer-false"
            className={`p-2 rounded-md border text-sm transition-colors bg-white ${
              correctAnswer === false ? "border-green-500" : "border-gray-200"
            }`}
          >
            Sai
          </div>
          {!hasAnswer && (
            <div className="p-3 rounded border bg-yellow-50 border-yellow-300 text-yellow-800">
              Không trả lời
            </div>
          )}
          {hasAnswer && userAnswer !== correctAnswer && (
            <div className="text-red-600 text-sm mt-2">
              Đã chọn: {userAnswer ? "Đúng" : "Sai"}
            </div>
          )}
        </div>
      );
    }
  };

  const renderNumberAnswer = (resultQuestion: any) => {
    const userAnswer = resultQuestion.userAnswer || resultQuestion.answer;
    const hasAnswer =
      userAnswer !== null &&
      userAnswer !== undefined &&
      userAnswer !== "" &&
      userAnswer !== "No answer";

    return (
      <div className="space-y-2">
        <div className="p-3 rounded border bg-gray-50">
          <span data-testid="user-answer">
            {hasAnswer
              ? renderMarkdownWithLatex(String(userAnswer))
              : "Chưa chọn đáp án"}
          </span>
        </div>
        <div className="p-3 rounded border bg-green-100 border-green-300">
          <span data-testid="correct-answer">
            {renderMarkdownWithLatex(
              String(resultQuestion.lessonQuestion?.correctAnswer || "N/A"),
            )}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-full mb-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p data-testid="error-message" className="text-destructive mb-4">
              {error || "Result not found"}
            </p>
            <Button
              data-testid="back-button"
              className="w-full"
              onClick={() => router.push("/lessons")}
            >
              Back to Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage =
    result.total_points > 0
      ? Math.round((result.score / result.total_points) * 100)
      : 0;

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="container mx-auto px-4 py-8">
      <div data-testid="result-container" className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold">
                    Điểm: {result.score}/{result.total_points}
                  </h1>
                  <span className="text-gray-600">
                    {result.lesson?.title ||
                      result.lesson_title ||
                      "Công nghệ cuối kì 2 [12A1] - Copy"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Cycle through: all -> correct -> incorrect -> all
                      if (sortFilter === "all") {
                        setSortFilter("correct");
                      } else if (sortFilter === "correct") {
                        setSortFilter("incorrect");
                      } else {
                        setSortFilter("all");
                      }
                    }}
                  >
                    {sortFilter === "all"
                      ? "Đúng & sai"
                      : sortFilter === "correct"
                        ? "Đúng"
                        : "Sai"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-gray-600">
                  Thông tin chi tiết
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Thời gian làm bài:</p>
                  <p className="text-sm font-medium">
                    {Math.floor(result.time_taken / 60)} phút{" "}
                    {result.time_taken % 60} giây
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian nộp bài:</p>
                  <p className="text-sm font-medium">
                    {new Date(result.timestamp).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trắc nghiệm:</p>
                  <p className="text-sm font-medium">
                    {result.score} (
                    {result.questions.filter((q) => q.isCorrect).length}/
                    {result.questions.length} câu)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4 border-b pb-3">
                  <h3 className="text-lg font-semibold text-blue-600 border-b-2 border-blue-600 pb-2">
                    Trắc nghiệm
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {filteredQuestions.map((resultQuestion, index) => {
                  const questionId =
                    resultQuestion.questionId || `q${index + 1}`;
                  const questionKey = `question_${questionId}`;
                  const lessonQuestion = resultQuestion.lessonQuestion;

                  if (!lessonQuestion) return null;

                  return (
                    <div
                      key={questionId}
                      data-testid={`question-card-${questionId}`}
                      className="space-y-4 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0"
                    >
                      {/* Question Header */}
                      <div className="font-semibold text-sm">
                        Câu {index + 1}
                      </div>

                      {/* Question Text */}
                      <div>
                        <h4 data-testid="question-text" className="text-base">
                          {renderMarkdownWithLatex(
                            lessonQuestion.question
                              .replace(/\[[\d.]+\s*pts?\]/gi, "") // Remove points notation
                              .replace(/\[img\s+src="[^"]+"\]/g, "") // Remove embedded images
                              .trim(),
                          )}
                        </h4>
                      </div>

                      {/* Question Image - Check both image field and embedded in question text */}
                      {(() => {
                        // First check if there's a direct image field
                        if (lessonQuestion.image) {
                          return (
                            <div className="my-4">
                              <img
                                data-testid="question-image"
                                src={lessonQuestion.image}
                                alt="Question image"
                                className="max-w-full h-auto rounded-lg"
                                onError={(e) => {
                                  console.error(
                                    "Failed to load image:",
                                    lessonQuestion.image,
                                  );
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          );
                        }

                        // Check for embedded image in question text [img src="..."]
                        const imageMatch = lessonQuestion.question.match(
                          /\[img\s+src="([^"]+)"\]/,
                        );
                        if (imageMatch && imageMatch[1]) {
                          return (
                            <div className="my-4">
                              <img
                                data-testid="question-image"
                                src={imageMatch[1]}
                                alt="Question image"
                                className="max-w-full h-auto rounded-lg"
                                onError={(e) => {
                                  console.error(
                                    "Failed to load embedded image:",
                                    imageMatch[1],
                                  );
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {/* Answer Display */}
                      <div className="space-y-2">
                        {lessonQuestion.type === "ABCD" ||
                        lessonQuestion.type === "abcd" ? (
                          lessonQuestion.choices &&
                          lessonQuestion.choices.length > 0 ? (
                            <div className="w-full">
                              {/* Determine layout based on choice lengths */}
                              {(() => {
                                // Check if any choice contains LaTeX formulas
                                const hasLatex = lessonQuestion.choices.some(
                                  (choice: string) =>
                                    choice.includes("$") ||
                                    choice.includes("\(") ||
                                    choice.includes("\["),
                                );

                                if (hasLatex) {
                                  // For LaTeX formulas, calculate visual length more accurately
                                  const maxVisualLength = Math.max(
                                    ...lessonQuestion.choices.map(
                                      (choice: string) => {
                                        // Remove LaTeX delimiters and count the content
                                        const latexContent = choice
                                          .replace(/\$\$/g, "")
                                          .replace(/\$/g, "");
                                        // Account for LaTeX commands and special characters
                                        const visualLength =
                                          latexContent.length +
                                          (latexContent.match(/\\/g) || [])
                                            .length *
                                            3;
                                        return visualLength;
                                      },
                                    ),
                                  );

                                  // Apply the user's requested layout rules for LaTeX
                                  if (maxVisualLength >= 20) {
                                    // For very long formulas, use 1 column
                                    return (
                                      <div className="grid grid-cols-1 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  } else if (maxVisualLength >= 10) {
                                    // For medium formulas, use 2 columns on desktop, 1 on mobile
                                    return (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  } else if (maxVisualLength >= 5) {
                                    // For short formulas on mobile, use 1 column; on desktop use 4
                                    return (
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // For very short formulas, can use 2 columns on mobile, 4 on desktop
                                    return (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  }
                                } else {
                                  // For non-LaTeX content, use responsive logic
                                  const maxLength = Math.max(
                                    ...lessonQuestion.choices.map(
                                      (choice: string) => choice.length,
                                    ),
                                  );

                                  if (
                                    maxLength < 20 &&
                                    lessonQuestion.choices.length === 4
                                  ) {
                                    // Very short text: 2 columns on mobile, 4 on desktop
                                    return (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  } else if (
                                    maxLength < 50 &&
                                    lessonQuestion.choices.length === 4
                                  ) {
                                    // Medium text: 1 column on mobile, 2 on desktop
                                    return (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // Long text: always 1 column
                                    return (
                                      <div className="grid grid-cols-1 gap-2">
                                        {lessonQuestion.choices.map(
                                          (choice: any, choiceIndex: number) =>
                                            renderChoice(
                                              choice,
                                              choiceIndex,
                                              lessonQuestion,
                                              resultQuestion,
                                            ),
                                        )}
                                      </div>
                                    );
                                  }
                                }
                              })()}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="p-2 rounded border bg-gray-50 text-sm">
                                <span className="font-medium">
                                  Câu trả lời của bạn:{" "}
                                </span>
                                <span data-testid="user-answer">
                                  {renderMarkdownWithLatex(
                                    String(
                                      resultQuestion.answer || "Không trả lời",
                                    ),
                                  )}
                                </span>
                              </div>
                              <div className="p-2 rounded border bg-green-100 border-green-300 text-sm">
                                <span className="font-medium">
                                  Đáp án đúng:{" "}
                                </span>
                                <span data-testid="correct-answer">
                                  {renderMarkdownWithLatex(
                                    String(
                                      lessonQuestion.correctAnswer || "N/A",
                                    ),
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        ) : null}

                        {(lessonQuestion.type === "TRUEFALSE" ||
                          lessonQuestion.type === "truefalse") &&
                          renderTrueFalseAnswer(resultQuestion)}

                        {lessonQuestion.type === "NUMBER" &&
                          renderNumberAnswer(resultQuestion)}
                      </div>

                      {/* AI Explain Button and Answer Display */}
                      <div className="pt-3 border-t flex items-center justify-between">
                        <Button
                          data-testid="ai-explain-button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExplainQuestion(
                              questionId,
                              lessonQuestion.question,
                              String(lessonQuestion.correctAnswer || "N/A"),
                              lessonQuestion.explanation,
                            )
                          }
                          disabled={loadingExplanations[questionKey]}
                          className="min-h-[44px] min-w-[44px] p-2"
                        >
                          {loadingExplanations[questionKey] ? (
                            "Đang tải..."
                          ) : (
                            <img
                              src="/Google-gemini.svg"
                              alt="Giải thích AI"
                              className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                            />
                          )}
                        </Button>

                        {/* Answer Status Box */}
                        {(lessonQuestion.type === "ABCD" ||
                          lessonQuestion.type === "abcd") && (
                          <div className="flex items-center gap-4 text-sm">
                            {/* Show "Đã chọn: X" for incorrect answers */}
                            {!resultQuestion.isCorrect &&
                              resultQuestion.answer &&
                              resultQuestion.answer !== "No answer" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">Đã chọn:</span>
                                  <span className="font-semibold text-red-600 px-2 py-1 bg-red-50 rounded border border-red-200">
                                    {renderMarkdownWithLatex(
                                      String(resultQuestion.answer),
                                    )}
                                  </span>
                                </div>
                              )}
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                Đáp án đúng:
                              </span>
                              <span className="font-semibold text-green-600 px-2 py-1 bg-green-50 rounded border border-green-200">
                                {renderMarkdownWithLatex(
                                  String(lessonQuestion.correctAnswer || "N/A"),
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Explanation */}
                      {explanations[questionKey] && (
                        <div
                          data-testid="ai-explanation"
                          data-collapsed={
                            collapsedExplanations[questionKey]
                              ? "true"
                              : "false"
                          }
                          className="mt-4"
                        >
                          {collapsedExplanations[questionKey] ? (
                            // Collapsed state - show bar with expand button
                            <div className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                              <h5 className="font-medium text-sm">
                                Giải thích chi tiết
                              </h5>
                              <Button
                                data-testid="collapse-button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleExplanationCollapse(questionId)
                                }
                              >
                                Mở rộng
                              </Button>
                            </div>
                          ) : (
                            // Expanded state - show full content
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="font-medium">
                                  Giải thích chi tiết
                                </h5>
                                <Button
                                  data-testid="collapse-button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleExplanationCollapse(questionId)
                                  }
                                >
                                  Thu gọn
                                </Button>
                              </div>
                              <div className="prose prose-sm max-w-none">
                                {renderMarkdownWithLatex(
                                  explanations[questionKey],
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Error */}
                      {explainErrors[questionKey] && (
                        <div
                          data-testid="ai-error-message"
                          className="mt-2 text-sm text-destructive"
                        >
                          {explainErrors[questionKey]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
