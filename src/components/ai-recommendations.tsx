'use client';

import { useState } from 'react';
import { getPersonalizedRecommendationsAction } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import type { PersonalizedRecommendationsInput } from '@/ai/flows/personalized-learning-recommendations';

type AiRecommendationsProps = {
  recommendationInput: PersonalizedRecommendationsInput;
};

export function AiRecommendations({ recommendationInput }: AiRecommendationsProps) {
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetRecommendations = async () => {
    setLoading(true);
    setRecommendations('');
    try {
      const result = await getPersonalizedRecommendationsAction(recommendationInput);
      setRecommendations(result.recommendations);
    } catch (error) {
      setRecommendations('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <div className='flex items-start justify-between'>
            <div>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    <span>AI Content Suggestions</span>
                </CardTitle>
                <CardDescription>Get personalized learning recommendations.</CardDescription>
            </div>
            <Button onClick={handleGetRecommendations} disabled={loading} size="sm">
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate
            </Button>
        </div>
      </CardHeader>
      {(loading || recommendations) && (
        <CardContent>
          {loading && (
             <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted-foreground/20" />
                <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted-foreground/20" />
                <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted-foreground/20" />
             </div>
          )}
          {recommendations && (
            <div className="text-sm text-foreground/80 prose prose-sm max-w-none">
              <p>{recommendations}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
