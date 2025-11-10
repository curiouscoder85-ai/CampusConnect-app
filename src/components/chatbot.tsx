'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Bot, Send, X, Loader2, Sparkle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { curiousBotAction } from '@/app/actions';
import { nanoid } from 'nanoid';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading || !user) return;

    const userMessage: Message = { id: nanoid(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const responseText = await curiousBotAction({ message: inputValue, userId: user.id });

    const botMessage: Message = { id: nanoid(), text: responseText, sender: 'bot' };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="relative">
                        <Bot className="h-7 w-7 text-primary" />
                        <Sparkle className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 fill-amber-400" />
                     </div>
                     <CardTitle className="font-headline text-xl">CuriousBot</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Bot className="h-12 w-12 mb-4" />
                        <p className="text-sm">Hi! I'm CuriousBot. Ask me about coding, personal growth, or anything else you're curious about!</p>
                     </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-start gap-3',
                        message.sender === 'user' && 'justify-end'
                      )}
                    >
                      {message.sender === 'bot' && (
                        <Avatar className="h-8 w-8 border-2 border-primary/50">
                            <div className="h-full w-full bg-primary/20 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.text}
                      </div>
                      {message.sender === 'user' && user && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                   {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border-2 border-primary/50">
                             <div className="h-full w-full bg-primary/20 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex w-full items-center space-x-2"
                  >
                    <Input
                      placeholder="Ask me anything..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          size="icon"
          className="rounded-full w-16 h-16 shadow-lg"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <AnimatePresence>
            {isOpen ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <X />
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Bot className="h-7 w-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </>
  );
}
