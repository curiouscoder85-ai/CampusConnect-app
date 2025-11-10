'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Course, Module, ContentItem } from '@/lib/types';
import { PlusCircle, FileText, Video, HelpCircle } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const contentIcons = {
  video: <Video className="h-4 w-4" />,
  reading: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

export function ModuleEditor({ course }: { course: Course }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [modules, setModules] = React.useState<Module[]>(course.modules || []);
  const [isModuleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [isContentDialogOpen, setContentDialogOpen] = React.useState(false);
  const [currentModuleId, setCurrentModuleId] = React.useState<string | null>(null);
  const [newModuleName, setNewModuleName] = React.useState('');
  const [newContent, setNewContent] = React.useState<{
    title: string;
    type: ContentItem['type'];
    url?: string;
    content?: string;
  }>({
    title: '',
    type: 'reading',
    url: '',
    content: '',
  });

  const handleAddModule = () => {
    if (!newModuleName) return;
    const newModule: Module = {
      id: `m-${Date.now()}`,
      title: newModuleName,
      description: '',
      content: [],
    };
    const updatedModules = [...modules, newModule];
    setModules(updatedModules);
    updateCourseInFirestore(updatedModules);
    setNewModuleName('');
    setModuleDialogOpen(false);
  };

  const handleAddContent = () => {
    if (!newContent.title || !currentModuleId) return;

    const newContentItem: ContentItem = {
      id: `c-${Date.now()}`,
      title: newContent.title,
      type: newContent.type,
      url: newContent.type === 'video' ? newContent.url : undefined,
      content: newContent.type === 'reading' ? newContent.content : undefined,
    };

    const updatedModules = modules.map((module) => {
      if (module.id === currentModuleId) {
        return { ...module, content: [...module.content, newContentItem] };
      }
      return module;
    });

    setModules(updatedModules);
    updateCourseInFirestore(updatedModules);
    setNewContent({ title: '', type: 'reading', url: '', content: '' });
    setContentDialogOpen(false);
    setCurrentModuleId(null);
  };

  const updateCourseInFirestore = (updatedModules: Module[]) => {
    const courseRef = doc(firestore, 'courses', course.id);
    updateDocumentNonBlocking(courseRef, { modules: updatedModules });
    toast({
      title: 'Course Updated',
      description: 'Your course modules have been saved.',
    });
  };
  
  const openContentDialog = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    setContentDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Course Modules</CardTitle>
          <CardDescription>Organize your course content into modules.</CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length > 0 ? (
            <Accordion type="multiple" defaultValue={modules.map(m => m.id)}>
              {modules.map((module) => (
                <AccordionItem value={module.id} key={module.id}>
                  <AccordionTrigger className="font-semibold">{module.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-4">
                      {module.content.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                          {contentIcons[item.type]}
                          <span>{item.title}</span>
                        </li>
                      ))}
                       <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => openContentDialog(module.id)}>
                         <PlusCircle className="mr-2 h-4 w-4" /> Add Content
                       </Button>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No modules created yet.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => setModuleDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </CardFooter>
      </Card>

      {/* Add Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>Enter a name for your new module.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="module-name">Module Name</Label>
            <Input
              id="module-name"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              placeholder="e.g., Introduction to..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddModule}>Add Module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Content Dialog */}
      <Dialog open={isContentDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setNewContent({ title: '', type: 'reading', url: '', content: '' });
        }
        setContentDialogOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
            <DialogDescription>Add a new piece of content to your module.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="content-title">Content Title</Label>
                <Input
                  id="content-title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="e.g., Welcome Video"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="content-type">Content Type</Label>
                 <Select
                    value={newContent.type}
                    onValueChange={(value: ContentItem['type']) => setNewContent({ ...newContent, type: value, url: '', content: '' })}
                  >
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
            {newContent.type === 'video' && (
                 <div className="space-y-2">
                    <Label htmlFor="content-url">Video URL</Label>
                    <Input
                      id="content-url"
                      value={newContent.url}
                      onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>
            )}
            {newContent.type === 'reading' && (
                 <div className="space-y-2">
                    <Label htmlFor="content-text">Reading Content</Label>
                    <Textarea
                      id="content-text"
                      value={newContent.content}
                      onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                      placeholder="Paste your article or reading material here..."
                      className="min-h-[150px]"
                    />
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContent}>Add Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
