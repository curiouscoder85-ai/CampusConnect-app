
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ContentItem, Question } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentPlayerProps {
  contentItem: ContentItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courseTitle: string;
}

function VideoPlayer({ url }: { url: string }) {
  // Regex to capture video ID from various YouTube URL formats
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    } else {
      return null;
    }
  };

  const videoId = getYouTubeId(url);
  
  if (!videoId) {
    return <div className="aspect-video w-full flex items-center justify-center bg-muted text-muted-foreground">Invalid YouTube URL</div>;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <div className="aspect-video">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

function ReadingPlayer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto rounded-md border p-4">
      <p>{content}</p>
    </div>
  );
}

function QuizPlayer({ questions }: { questions: Question[] }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const score = Object.keys(selectedAnswers).reduce((acc, qIndex) => {
    const question = questions[Number(qIndex)];
    const selected = selectedAnswers[Number(qIndex)];
    return acc + (question.correctAnswer === selected ? 1 : 0);
  }, 0);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answerIndex });
  };
  
  const handleSubmit = () => {
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
       <Card className="text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Quiz Results</CardTitle>
                <CardDescription>You scored...</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-5xl font-bold">{Math.round((score / questions.length) * 100)}%</p>
                <p className="text-muted-foreground">({score} out of {questions.length} correct)</p>
            </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-6">
        <div>
            <p className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <h4 className="font-semibold text-lg mt-1">{currentQuestion.text}</h4>
        </div>
        <RadioGroup 
            onValueChange={(value) => handleSelectAnswer(currentQuestionIndex, parseInt(value))}
            value={selectedAnswers[currentQuestionIndex]?.toString()}
            className="space-y-2"
        >
            {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}-o${index}`} />
                    <Label htmlFor={`q${currentQuestionIndex}-o${index}`}>{option}</Label>
                </div>
            ))}
        </RadioGroup>
        <div className="flex justify-between items-center">
             <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>Back</Button>
             {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length !== questions.length}>Submit Quiz</Button>
             ) : (
                <Button onClick={handleNext}>Next</Button>
             )}
        </div>
    </div>
  )
}

export function ContentPlayer({ contentItem, isOpen, onOpenChange, courseTitle }: ContentPlayerProps) {

  const renderContent = () => {
    if (!contentItem) return null;

    switch (contentItem.type) {
      case 'video':
        return <VideoPlayer url={contentItem.url || ''} />;
      case 'reading':
        return <ReadingPlayer content={contentItem.content || 'No content available.'} />;
      case 'quiz':
        // Mock questions if not provided
        const questions = contentItem.questions || [
            { id: 'q1', text: 'What does HTML stand for?', options: ['Hyper Trainer Marking Language', 'Hyper Text Markup Language', 'High Tech Modern Language'], correctAnswer: 1 },
            { id: 'q2', text: 'Which CSS property controls the text size?', options: ['font-size', 'text-size', 'font-style'], correctAnswer: 0 }
        ];
        return <QuizPlayer questions={questions} />;
      default:
        return <p>Unsupported content type.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contentItem?.title}</DialogTitle>
          <DialogDescription>
            {courseTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {renderContent()}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
