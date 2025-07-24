'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Trophy, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface Result {
  id: string;
  lesson_id: string;
  score: number;
  total_points: number;
  timestamp: string;
  questions: any[];
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/results/${resultId}`);
      
      if (response.data.success && response.data.result) {
        setResult(response.data.result);
      } else {
        setError('Failed to load result');
      }
    } catch (err) {
      console.error('Error fetching result:', err);
      setError('Failed to load result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
            <p className="text-destructive mb-4">{error || 'Result not found'}</p>
            <Button 
              className="w-full" 
              onClick={() => router.push('/lessons')}
            >
              Back to Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = result.total_points > 0 
    ? Math.round((result.score / result.total_points) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Kết quả bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              {percentage >= 70 ? (
                <Trophy className="h-24 w-24 text-yellow-500" />
              ) : percentage >= 50 ? (
                <CheckCircle className="h-24 w-24 text-green-500" />
              ) : (
                <XCircle className="h-24 w-24 text-red-500" />
              )}
            </div>

            <div>
              <div className="text-5xl font-bold mb-2">
                {result.score}/{result.total_points}
              </div>
              <div className="text-2xl text-muted-foreground">
                {percentage}%
              </div>
            </div>

            <div className="space-y-4">
              <Badge 
                variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}
                className="text-lg py-2 px-4"
              >
                {percentage >= 70 ? "Xuất sắc!" : percentage >= 50 ? "Đạt yêu cầu" : "Cần cải thiện"}
              </Badge>
            </div>

            <div className="flex gap-4 justify-center pt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/lessons')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về danh sách bài học
              </Button>
              <Button
                onClick={() => router.push(`/lesson/${result.lesson_id}`)}
              >
                Làm lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}