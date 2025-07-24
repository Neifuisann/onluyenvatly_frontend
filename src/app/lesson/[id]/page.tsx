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
import { AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Flag } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8" data-testid="lesson-container">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="lesson-title">
          {lesson.title}
        </h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Badge variant="secondary">{lesson.subject}</Badge>
          <Badge variant="secondary">Lớp {lesson.grade}</Badge>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span data-testid="timer-display">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button - Fixed position */}
      <Button
        data-testid="submit-button"
        className="fixed top-4 right-4 z-50"
        onClick={() => setShowConfirmDialog(true)}
      >
        Nộp bài
      </Button>

      {/* Question Navigation */}
      <div className="max-w-4xl mx-auto mb-6">
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
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={cn(
                  "w-10 h-10 p-0",
                  isActive && "ring-2 ring-primary"
                )}
              >
                {index + 1}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Question Content */}
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
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => handleAnswerChange(currentQuestion.id, choiceLabel)}
                      data-testid={`choice-${currentQuestionIndex}-${choiceLabel}`}
                      data-selected={isSelected}
                    >
                      <CardContent className="flex items-center p-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full mr-4 font-semibold",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {choiceLabel}
                        </div>
                        <div className="flex-1">
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
                              size="sm"
                              onClick={() => {
                                const newAnswer = { ...(currentAnswer?.answer as any || {}) };
                                newAnswer[statementLabel] = true;
                                handleAnswerChange(currentQuestion.id, newAnswer);
                              }}
                              className="min-w-[80px]"
                            >
                              Đúng
                            </Button>
                            <Button
                              variant={currentStatementAnswer === false ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newAnswer = { ...(currentAnswer?.answer as any || {}) };
                                newAnswer[statementLabel] = false;
                                handleAnswerChange(currentQuestion.id, newAnswer);
                              }}
                              className="min-w-[80px]"
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
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant={currentAnswer?.answer === true ? "default" : "outline"}
                      onClick={() => handleAnswerChange(currentQuestion.id, true)}
                      className="min-w-[120px]"
                    >
                      Đúng
                    </Button>
                    <Button
                      variant={currentAnswer?.answer === false ? "default" : "outline"}
                      onClick={() => handleAnswerChange(currentQuestion.id, false)}
                      className="min-w-[120px]"
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
                  className="text-center"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          data-testid="prev-question"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Câu trước
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.min(lesson.questions.length - 1, prev + 1))}
          disabled={currentQuestionIndex === lesson.questions.length - 1}
          data-testid="next-question"
        >
          Câu sau
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

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
  );
}