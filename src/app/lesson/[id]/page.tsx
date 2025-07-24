'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Flag, Check, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
// import { toast } from '@/hooks/use-toast'; // TODO: Add toast component
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Question {
  id: string;
  type: 'ABCD' | 'TRUEFALSE' | 'NUMBER';
  question: string;
  choices?: string[];
  image?: string;
  points: number;
  correctAnswer?: string | number | boolean;
}

interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  questions: Question[];
  description?: string;
}

interface Answer {
  questionId: string;
  answer: string | number | boolean | null;
  type: string;
  points: number;
  earnedPoints?: number;
  isCorrect?: boolean;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime]);

  // Fetch lesson data
  useEffect(() => {
    if (!lessonId) {
      setError('No lesson ID provided');
      setLoading(false);
      return;
    }

    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/lessons/${lessonId}`);
      
      if (response.data.success && response.data.lesson) {
        // Transform the lesson data to match our expected format
        const transformedLesson = {
          ...response.data.lesson,
          questions: response.data.lesson.questions.map((q: any) => {
            // Extract image from question text if present
            let questionText = q.question || '';
            let imageUrl = null;
            
            // Extract image URL from [img src="..."] format
            const imageMatch = questionText.match(/\[img\s+src="([^"]+)"\]/);
            if (imageMatch) {
              imageUrl = imageMatch[1];
              questionText = questionText.replace(imageMatch[0], '').trim();
            }
            
            // Remove [X pts] notation from question text
            questionText = questionText.replace(/\[\d+(\.\d+)?\s*pts\]/g, '').trim();
            
            // Transform the question structure
            const transformedQuestion: Question = {
              id: q.id,
              type: (q.type || '').toUpperCase() as 'ABCD' | 'TRUEFALSE' | 'NUMBER',
              question: questionText,
              points: q.points || 0,
              correctAnswer: q.correct,
              image: imageUrl
            };
            
            // Transform options to choices for ABCD and TRUEFALSE questions
            if ((transformedQuestion.type === 'ABCD' || transformedQuestion.type === 'TRUEFALSE') && q.options) {
              transformedQuestion.choices = q.options.map((opt: any) => 
                typeof opt === 'string' ? opt : opt.text || ''
              );
            }
            
            return transformedQuestion;
          })
        };
        
        setLesson(transformedLesson);
        
        // Initialize answers map
        const initialAnswers = new Map<string, Answer>();
        transformedLesson.questions.forEach((q: Question) => {
          initialAnswers.set(q.id, {
            questionId: q.id,
            answer: null,
            type: q.type,
            points: q.points,
          });
        });
        setAnswers(initialAnswers);
      } else {
        setError('Failed to load lesson');
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLatex = (text: string) => {
    if (!text) return null;

    // Split text by LaTeX delimiters
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Block math
        const math = part.slice(2, -2);
        return (
          <div key={index} data-testid="latex-block" className="my-4">
            <BlockMath>{math}</BlockMath>
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline math
        const math = part.slice(1, -1);
        return <InlineMath key={index} data-testid="latex-inline">{math}</InlineMath>;
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  const handleAnswerChange = (questionId: string, answer: string | number | boolean) => {
    const question = lesson?.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => new Map(prev).set(questionId, {
      questionId,
      answer,
      type: question.type,
      points: question.points,
    }));
  };

  const calculateStats = () => {
    let answered = 0;
    let unanswered = 0;
    let flagged = 0;

    answers.forEach((answer) => {
      if (answer.answer !== null) {
        answered++;
      } else {
        unanswered++;
      }
    });

    return { answered, unanswered, flagged };
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Authentication Required: Please log in to submit your answers.');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from(answers.values()).map(answer => {
        const question = lesson?.questions.find(q => q.id === answer.questionId);
        let isCorrect = false;
        let earnedPoints = 0;

        if (question && answer.answer !== null) {
          if (question.type === 'ABCD') {
            isCorrect = answer.answer === question.correctAnswer;
          } else if (question.type === 'TRUEFALSE') {
            isCorrect = answer.answer === question.correctAnswer;
          } else if (question.type === 'NUMBER') {
            isCorrect = Number(answer.answer) === Number(question.correctAnswer);
          }
          
          if (isCorrect) {
            earnedPoints = question.points;
          }
        }

        return {
          ...answer,
          isCorrect,
          earnedPoints,
        };
      });

      const response = await apiClient.post('/results', {
        lessonId,
        answers: answersArray,
        timeTaken: elapsedTime,
        studentInfo: {
          id: user.id,
          username: user.username,
        },
        mode: 'test',
      });

      if (response.data.success && response.data.resultId) {
        router.push(`/results/${response.data.resultId}`);
      } else {
        throw new Error('Failed to submit results');
      }
    } catch (err) {
      console.error('Error submitting results:', err);
      alert('Submission Failed: Failed to submit your answers. Please try again.');
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Lesson not found'}</p>
            </div>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/lessons')}
            >
              Back to Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = lesson.questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <>
      <style jsx global>{`
        [data-testid="lesson-container"] * {
          font-size: inherit !important;
        }
        [data-testid="lesson-container"] .text-xs { font-size: inherit !important; }
        [data-testid="lesson-container"] .text-sm { font-size: inherit !important; }
        [data-testid="lesson-container"] .text-base { font-size: inherit !important; }
        [data-testid="lesson-container"] .text-lg { font-size: inherit !important; }
        [data-testid="lesson-container"] .text-xl { font-size: inherit !important; }
        [data-testid="lesson-container"] .text-2xl { font-size: 1.5em !important; }
        [data-testid="lesson-container"] .text-3xl { font-size: 1.875em !important; }
        
        /* Prevent zooming on lesson pages */
        html, body {
          touch-action: pan-x pan-y;
        }
        input[type="text"],
        input[type="number"],
        input[type="email"],
        input[type="tel"],
        textarea,
        select {
          font-size: 16px !important; /* Prevents zoom on iOS when focusing inputs */
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        [data-testid="lesson-container"] button,
        [data-testid="lesson-container"] input {
          -webkit-user-select: auto;
          user-select: auto;
        }
      `}</style>
      <div 
        className="container mx-auto px-3 sm:px-4 py-4 sm:py-8" 
        data-testid="lesson-container" 
        style={{ 
          fontSize: `${fontSize}px`
        }}
      >
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col gap-4">
          {/* Title and Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="lesson-title">
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-muted-foreground">
              <Badge variant="secondary" className="text-xs sm:text-sm">{lesson.subject}</Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm">Lớp {lesson.grade}</Badge>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span data-testid="timer-display">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
          
          {/* Controls - Mobile: buttons first, then font size below */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3">
            {/* Font Size Controls - Below buttons on mobile */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm text-muted-foreground">Cỡ chữ:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="h-8 w-8 p-0"
                  disabled={fontSize <= 12}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm font-medium min-w-[3ch] text-center">{fontSize}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                  className="h-8 w-8 p-0"
                  disabled={fontSize >= 24}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* View Mode Toggle & Submit - Smaller on mobile */}
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="h-9 sm:h-10 flex-1 sm:flex-initial text-sm"
              >
                {showAllQuestions ? 'Xem từng câu' : 'Xem tất cả'}
              </Button>
              
              <Button
                data-testid="submit-button"
                onClick={() => setShowConfirmDialog(true)}
                className="h-9 sm:h-10 flex-1 sm:flex-initial text-sm"
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* Question Navigation - Desktop only here */}
      {!showAllQuestions && (
        <div className="hidden sm:block max-w-4xl mx-auto mb-6">
          <div 
            className="flex flex-wrap gap-2" 
            data-testid="question-navigation"
          >
            {lesson.questions.map((question, index) => {
              const answer = answers.get(question.id);
              const isAnswered = answer?.answer !== null;
              const isActive = index === currentQuestionIndex;

              return (
                <Button
                  key={question.id}
                  data-testid={`question-nav-${index}`}
                  data-active={isActive}
                  variant={isActive ? "default" : isAnswered ? "secondary" : "outline"}
                  size="default"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    "w-12 h-12 p-0 relative font-medium text-base",
                    isActive && "ring-2 ring-primary",
                    isAnswered && !isActive && "bg-green-50 border-green-200 hover:bg-green-100"
                  )}
                >
                  {index + 1}
                  {isAnswered && !isActive && (
                    <Check className="h-3 w-3 absolute top-1 right-1 text-green-600" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Content */}
      {showAllQuestions ? (
        // Show all questions view
        <div className="max-w-4xl mx-auto space-y-6">
          {lesson.questions.map((question, index) => {
            const answer = answers.get(question.id);
            return (
              <Card key={question.id} className="relative" data-testid={`question-card-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Câu {index + 1}</span>
                    <Badge variant="outline">{question.points.toFixed(1)} điểm</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div data-testid={`question-content-${index}`}>
                      {renderLatex(question.question)}
                    </div>
                  </div>

                  {/* Question Image */}
                  {question.image && (
                    <div className="mb-6">
                      <img
                        src={question.image}
                        alt="Question illustration"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}

                  {/* Answer Options */}
                  <div className="space-y-4">
                    {question.type === 'ABCD' && question.choices && (
                      <div className="grid gap-3">
                        {question.choices.map((choice, idx) => {
                          const choiceLabel = String.fromCharCode(65 + idx);
                          const isSelected = answer?.answer === choiceLabel;
                          return (
                            <Card
                              key={idx}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                              )}
                              onClick={() => handleAnswerChange(question.id, choiceLabel)}
                              style={{ fontSize: 'inherit' }}
                            >
                              <CardContent className="flex items-center p-3 sm:p-4" style={{ fontSize: 'inherit' }}>
                                <div className={cn(
                                  "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full mr-3 sm:mr-4 font-semibold relative flex-shrink-0",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                  {choiceLabel}
                                  {isSelected && (
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
                                  )}
                                </div>
                                <div className="flex-1" style={{ fontSize: 'inherit' }}>
                                  {renderLatex(choice)}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'TRUEFALSE' && (
                      <div className="space-y-4">
                        {question.choices ? (
                          question.choices.map((statement, idx) => {
                            const statementLabel = String.fromCharCode(65 + idx);
                            const currentStatementAnswer = (answer?.answer as any)?.[statementLabel];
                            
                            return (
                              <Card key={idx} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <span className="font-semibold text-muted-foreground">{statementLabel})</span>
                                    <div className="flex-1">
                                      {renderLatex(statement)}
                                    </div>
                                  </div>
                                  <div className="flex gap-3 justify-end">
                                    <Button
                                      variant={currentStatementAnswer === true ? "default" : "outline"}
                                      size="default"
                                      onClick={() => {
                                        const newAnswer = { ...(answer?.answer as any || {}) };
                                        newAnswer[statementLabel] = true;
                                        handleAnswerChange(question.id, newAnswer);
                                      }}
                                      className="min-w-[80px] sm:min-w-[100px] h-10 sm:h-11"
                                    >
                                      Đúng
                                    </Button>
                                    <Button
                                      variant={currentStatementAnswer === false ? "default" : "outline"}
                                      size="default"
                                      onClick={() => {
                                        const newAnswer = { ...(answer?.answer as any || {}) };
                                        newAnswer[statementLabel] = false;
                                        handleAnswerChange(question.id, newAnswer);
                                      }}
                                      className="min-w-[80px] sm:min-w-[100px] h-10 sm:h-11"
                                    >
                                      Sai
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })
                        ) : (
                          <div className="flex gap-3 sm:gap-4 justify-center">
                            <Button
                              variant={answer?.answer === true ? "default" : "outline"}
                              onClick={() => handleAnswerChange(question.id, true)}
                              className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12"
                            >
                              Đúng
                            </Button>
                            <Button
                              variant={answer?.answer === false ? "default" : "outline"}
                              onClick={() => handleAnswerChange(question.id, false)}
                              className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12"
                            >
                              Sai
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === 'NUMBER' && (
                      <div className="max-w-xs mx-auto">
                        <Input
                          type="number"
                          placeholder="Nhập câu trả lời"
                          value={answer?.answer as number || ''}
                          onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
                          className="text-center h-12"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Single question view
        <Card className="max-w-4xl mx-auto" data-testid="question-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Câu {currentQuestionIndex + 1}</span>
              <Badge variant="outline">{currentQuestion.points.toFixed(1)} điểm</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              data-testid={`question-content-${currentQuestionIndex}`}
              className="mb-6"
            >
              <div 
                data-testid="question-content"
                data-testid-2={`question-type-${currentQuestionIndex}`}
                data-type={currentQuestion.type}
              >
                {renderLatex(currentQuestion.question)}
              </div>
            </div>

            {/* Question Image */}
            {currentQuestion.image && (
              <div 
                className="mb-6" 
                data-testid="question-image-container"
              >
                <img
                  src={currentQuestion.image}
                  alt="Question illustration"
                  className="max-w-full h-auto rounded-lg"
                  data-testid={`question-image-${currentQuestionIndex}`}
                />
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.type === 'ABCD' && currentQuestion.choices && (
                <div className="grid gap-3">
                  {currentQuestion.choices.map((choice, idx) => {
                    const choiceLabel = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected = currentAnswer?.answer === choiceLabel;
                    return (
                      <Card
                        key={idx}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                        )}
                        onClick={() => handleAnswerChange(currentQuestion.id, choiceLabel)}
                        data-testid={`choice-${currentQuestionIndex}-${choiceLabel}`}
                        data-selected={isSelected}
                      >
                        <CardContent className="flex items-center p-3 sm:p-4">
                          <div className={cn(
                            "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full mr-3 sm:mr-4 font-semibold text-sm sm:text-base relative flex-shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            {choiceLabel}
                            {isSelected && (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
                            )}
                          </div>
                          <div className="flex-1 text-sm sm:text-base">
                            {renderLatex(choice)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'TRUEFALSE' && (
                <div className="space-y-4">
                  {currentQuestion.choices ? (
                    // Multiple sub-statements format
                    currentQuestion.choices.map((statement, idx) => {
                      const statementLabel = String.fromCharCode(65 + idx); // A, B, C, D
                      const currentStatementAnswer = (currentAnswer?.answer as any)?.[statementLabel];
                      
                      return (
                        <Card key={idx} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="font-semibold text-muted-foreground">{statementLabel})</span>
                              <div className="flex-1">
                                {renderLatex(statement)}
                              </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant={currentStatementAnswer === true ? "default" : "outline"}
                                size="default"
                                onClick={() => {
                                  const newAnswer = { ...(currentAnswer?.answer as any || {}) };
                                  newAnswer[statementLabel] = true;
                                  handleAnswerChange(currentQuestion.id, newAnswer);
                                }}
                                className="min-w-[80px] sm:min-w-[100px] h-10 sm:h-11"
                              >
                                Đúng
                              </Button>
                              <Button
                                variant={currentStatementAnswer === false ? "default" : "outline"}
                                size="default"
                                onClick={() => {
                                  const newAnswer = { ...(currentAnswer?.answer as any || {}) };
                                  newAnswer[statementLabel] = false;
                                  handleAnswerChange(currentQuestion.id, newAnswer);
                                }}
                                className="min-w-[80px] sm:min-w-[100px] h-10 sm:h-11"
                              >
                                Sai
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    // Single True/False format (fallback)
                    <div className="flex gap-3 sm:gap-4 justify-center">
                      <Button
                        variant={currentAnswer?.answer === true ? "default" : "outline"}
                        onClick={() => handleAnswerChange(currentQuestion.id, true)}
                        className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12"
                      >
                        Đúng
                      </Button>
                      <Button
                        variant={currentAnswer?.answer === false ? "default" : "outline"}
                        onClick={() => handleAnswerChange(currentQuestion.id, false)}
                        className="min-w-[120px] sm:min-w-[140px] h-10 sm:h-12"
                      >
                        Sai
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'NUMBER' && (
                <div className="max-w-xs mx-auto">
                  <Input
                    type="number"
                    placeholder="Nhập câu trả lời"
                    value={currentAnswer?.answer as number || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, Number(e.target.value))}
                    data-testid={`number-input-${currentQuestionIndex}`}
                    className="text-center h-12"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons and Mobile Question Grid */}
      {!showAllQuestions && (
        <>
          <div className="max-w-4xl mx-auto mt-6 flex justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              data-testid="prev-question"
              className="h-12 px-6"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Câu trước
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(lesson.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === lesson.questions.length - 1}
              data-testid="next-question"
              className="h-12 px-6"
            >
              Câu sau
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
          
          {/* Question Navigation - Mobile only, below navigation buttons */}
          <div className="sm:hidden max-w-4xl mx-auto mt-4">
            <div 
              className="grid grid-cols-8 gap-1.5" 
              data-testid="question-navigation-mobile"
            >
              {lesson.questions.map((question, index) => {
                const answer = answers.get(question.id);
                const isAnswered = answer?.answer !== null;
                const isActive = index === currentQuestionIndex;

                return (
                  <Button
                    key={question.id}
                    data-testid={`question-nav-mobile-${index}`}
                    data-active={isActive}
                    variant={isActive ? "default" : isAnswered ? "secondary" : "outline"}
                    size="default"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      "w-full h-10 p-0 relative font-medium text-sm",
                      isActive && "ring-2 ring-primary",
                      isAnswered && !isActive && "bg-green-50 border-green-200 hover:bg-green-100"
                    )}
                  >
                    {index + 1}
                    {isAnswered && !isActive && (
                      <Check className="h-2.5 w-2.5 absolute top-0.5 right-0.5 text-green-600" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent data-testid="submit-confirmation-popup">
          <DialogHeader>
            <DialogTitle data-testid="confirmation-title">Xác nhận nộp bài</DialogTitle>
            <DialogDescription data-testid="confirmation-message">
              Bạn có chắc chắn muốn nộp bài không? Sau khi nộp, bạn không thể thay đổi câu trả lời.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 my-4">
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="answered-count">
                {calculateStats().answered}
              </div>
              <div className="text-sm text-muted-foreground">Đã trả lời</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="unanswered-count">
                {calculateStats().unanswered}
              </div>
              <div className="text-sm text-muted-foreground">Chưa trả lời</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="flagged-count">
                {calculateStats().flagged}
              </div>
              <div className="text-sm text-muted-foreground">Đã đánh dấu</div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              data-testid="cancel-submit"
            >
              Quay lại
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              data-testid="confirm-submit"
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}