import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerRuntime
} from '@assistant-ui/react';
import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  SearchIcon,
  BookOpenIcon,
  DropletIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  BrainIcon,
  PlusIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '@/components/ui/button';
import { MarkdownText } from '@/components/assistant-ui/markdown-text';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import { useThread } from '@assistant-ui/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { motion } from 'framer-motion';
import { backendUrl } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { ToolFallback } from './tool-fallback';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import dynamic from 'next/dynamic';
const VoiceRecorder = dynamic(() => import('@/components/voice-recording'), {
  ssr: false,
});
interface PLCData {
  timestamp: string;
  data: Record<string, number>;
  threshold: Record<string, number | [number, number]>;
  status: Record<string, boolean>;
  all_normal: boolean;
}
const user = {
  avatar: 'URL_ADDRESSars.githubusercontent.com/u/102832491?v=4',
  name: 'Chao',
};
export const Thread: FC = () => {
  const messages = useThread((t) => t.messages);
  return (
    <ThreadPrimitive.Root
      className='box-border flex overflow-hidden relative flex-col h-full rounded-lg border-0 shadow-none bg-background text-foreground font-outfit'
      style={{
        ['--thread-max-width' as string]: '64rem',
      }}>
      <SidebarTrigger className='fixed top-4 z-50 ml-2' />
      <div className='mx-auto my-0 h-full w-full max-w-[var(--thread-max-width)]'>
        <ThreadPrimitive.Viewport
          className={cn(
            'flex flex-col flex-grow h-full overflow-y-scroll no-scrollbar scroll-smooth bg-inherit px-4 pt-8',
            {
              'justify-center items-center': messages.length === 0,
              'items-center': messages.length > 0,
            }
          )}>
          <ThreadWelcome />
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              EditComposer: EditComposer,
              AssistantMessage: AssistantMessage,
            }}
          />
          <ThreadPrimitive.If empty={false}>
            <div className='flex-grow min-h-8' />
          </ThreadPrimitive.If>
          <div className='sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-gradient-to-t from-background via-background to-transparent pb-4 pt-6'>
            <ThreadScrollToBottom />
            <Composer />
          </div>
          <ThreadPrimitive.Empty>
            <PLCDataDisplay />
          </ThreadPrimitive.Empty>
        </ThreadPrimitive.Viewport>
      </div>
    </ThreadPrimitive.Root>
  );
};
const PLCDataDisplay: FC = () => {
  const [plcData, setPlcData] = useState<PLCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const fetchPLCData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/plc/data`);
        if (!response.ok) {
          throw new Error('Failed to fetch PLC data');
        }
        const data = await response.json();
        setPlcData(data);
        setError(null);
      } catch (err) {
        setError('Error fetching PLC data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPLCData();
    const interval = setInterval(fetchPLCData, 172800000);
    return () => clearInterval(interval);
  }, []);
  if (loading && !plcData) {
    return (
      <div className='w-full max-w-[var(--thread-max-width)] p-4 flex justify-center'>
        <div className='animate-pulse text-muted-foreground'>
          Loading sensor data...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className='w-full max-w-[var(--thread-max-width)] p-4 flex justify-center'>
        <div className='flex gap-2 items-center text-destructive'>
          <AlertTriangleIcon className='w-4 h-4' />
          {error}
        </div>
      </div>
    );
  }
  const metrics = [
    {
      title: t('TSSOutput'),
      key: 'TSS_OUT',
      color: 'emerald',
      delay: 1.1,
    },
    {
      title: t('CODOutput'),
      key: 'COD_OUT',
      color: 'blue',
      delay: 1.2,
    },
    {
      title: t('NH4Output'),
      key: 'NH4_OUT',
      color: 'violet',
      delay: 1.3,
    },
    {
      title: t('pHLevel'),
      key: 'pH_OUT',
      color: 'amber',
      delay: 1.4,
    },
  ];
  return (
    <div className='flex gap-4 w-full max-w-[var(--thread-max-width)] p-4 overflow-x-auto'>
      {plcData &&
        metrics.map((item, index) => {
          const value = plcData.data[item.key] || 0;
          const isNormal =
            plcData.status[item.key] !== undefined
              ? plcData.status[item.key]
              : true;
          const threshold = plcData.threshold[item.key];
          const maxValue = Array.isArray(threshold)
            ? `${threshold[0]} - ${threshold[1]}`
            : threshold?.toString() || '0';
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              transition={{ duration: 0.3, delay: item.delay }}
              className={`flex-1 flex flex-col p-4 bg-gradient-to-br rounded-xl border from-${item.color}-50/50 to-slate-50 dark:from-${item.color}-900/20 dark:to-slate-800/50 border-border hover:shadow-lg hover:border-${item.color}-200 dark:hover:border-${item.color}-700 transition-all duration-300 ease-in-out cursor-default`}>
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
                className='mb-2 text-sm font-medium text-muted-foreground'>
                {item.title}
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className='mb-1 text-2xl font-bold text-foreground'>
                {value.toFixed(2)}
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className='flex gap-2 items-center'>
                <div
                  className={`flex items-center ${
                    isNormal ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                  {isNormal ? (
                    <CheckIcon className='mr-1 w-4 h-4' />
                  ) : (
                    <AlertTriangleIcon className='mr-1 w-4 h-4' />
                  )}
                  <span className='text-xs'>
                    {isNormal ? t('normal') : t('alert')}
                  </span>
                </div>
                <span className='text-xs text-muted-foreground'>
                  / {maxValue}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
    </div>
  );
};
const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip='Scroll to bottom'
        variant='outline'
        className='absolute -top-8 rounded-full disabled:invisible'>
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};
const ThreadWelcome: FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <ThreadPrimitive.Empty>
      <div className='relative w-full'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='flex w-full max-w-[var(--thread-max-width)] flex-col'>
          <div className='flex flex-col flex-grow justify-center items-center w-full'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isVisible ? 1 : 0.8,
                opacity: isVisible ? 1 : 0,
              }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className='flex justify-center items-center mb-6'>
              <DropletIcon className='w-12 h-12 text-primary' />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
              className='mb-2 text-4xl font-bold text-center'>
              {t('wastewaterAssistant')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
              transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
              className='mb-10 max-w-2xl text-lg text-center text-muted-foreground whitespace-pre-line'>
              {t('askAnything')}
            </motion.p>
          </div>
          <ThreadWelcomeSuggestions isVisible={isVisible} />
        </motion.div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
const ThreadWelcomeSuggestions: FC<{ isVisible?: boolean }> = ({
  isVisible = true,
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
      className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[var(--thread-max-width)]'>
      <ThreadPrimitive.Suggestion
        className='flex overflow-hidden relative items-start p-5 bg-gradient-to-br rounded-xl border transition-all duration-300 ease-in-out group from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-slate-100 dark:hover:from-blue-900/20 dark:hover:to-slate-800 border-border'
        prompt={t('generalAssistance')}
        method='replace'
        autoSend>
        <div className='absolute top-0 left-0 w-1 h-full opacity-70 bg-primary'></div>
        <div className='absolute -right-12 -bottom-12 z-0 w-24 h-24 rounded-full bg-primary/5'></div>
        <div className='mr-4 mt-0.5 text-primary bg-primary/10 p-2 rounded-lg z-10'>
          <SearchIcon className='w-5 h-5' />
        </div>
        <div className='z-10'>
          <h3 className='mb-1 font-medium transition-colors group-hover:text-primary'>
            {t('generalAssistanceTitle')}
          </h3>
          <p className='text-sm text-muted-foreground'>
            {t('generalAssistance')}
          </p>
        </div>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className='flex overflow-hidden relative items-start p-5 bg-gradient-to-br rounded-xl border transition-all duration-300 ease-in-out group from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-slate-100 dark:hover:from-cyan-900/20 dark:hover:to-slate-800 border-border'
        prompt={t('waterQualityPrompt')}
        method='replace'
        autoSend>
        <div className='absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-70'></div>
        <div className='absolute -right-12 -bottom-12 z-0 w-24 h-24 rounded-full bg-cyan-500/5'></div>
        <div className='mr-4 mt-0.5 text-cyan-500 bg-cyan-500/10 p-2 rounded-lg z-10'>
          <DropletIcon className='w-5 h-5' />
        </div>
        <div className='z-10'>
          <h3 className='mb-1 font-medium transition-colors group-hover:text-cyan-500'>
            {t('waterQualityTitle')}
          </h3>
          <p className='text-sm text-muted-foreground'>{t('waterQuality')}</p>
        </div>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className='flex overflow-hidden relative items-start p-5 bg-gradient-to-br rounded-xl border transition-all duration-300 ease-in-out group from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-slate-100 dark:hover:from-amber-900/20 dark:hover:to-slate-800 border-border'
        prompt={t('reportsPrompt')}
        method='replace'
        autoSend>
        <div className='absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-70'></div>
        <div className='absolute -right-12 -bottom-12 z-0 w-24 h-24 rounded-full bg-amber-500/5'></div>
        <div className='mr-4 mt-0.5 text-amber-500 bg-amber-500/10 p-2 rounded-lg z-10'>
          <BarChart3Icon className='w-5 h-5' />
        </div>
        <div className='z-10'>
          <h3 className='mb-1 font-medium transition-colors group-hover:text-amber-500'>
            {t('reportsTitle')}
          </h3>
          <p className='text-sm text-muted-foreground'>{t('reports')}</p>
        </div>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className='flex overflow-hidden relative items-start p-5 bg-gradient-to-br rounded-xl border transition-all duration-300 ease-in-out group from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-slate-100 dark:hover:from-emerald-900/20 dark:hover:to-slate-800 border-border'
        prompt={t('knowledgeBasePrompt')}
        method='replace'
        autoSend>
        <div className='absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-70'></div>
        <div className='absolute -right-12 -bottom-12 z-0 w-24 h-24 rounded-full bg-emerald-500/5'></div>
        <div className='mr-4 mt-0.5 text-emerald-500 bg-emerald-500/10 p-2 rounded-lg z-10'>
          <BookOpenIcon className='w-5 h-5' />
        </div>
        <div className='z-10'>
          <h3 className='mb-1 font-medium transition-colors group-hover:text-emerald-500'>
            {t('knowledgeBaseTitle')}
          </h3>
          <p className='text-sm text-muted-foreground'>{t('knowledgeBase')}</p>
        </div>
      </ThreadPrimitive.Suggestion>
    </motion.div>
  );
};
const Composer: React.FC = () => {
  const { t } = useTranslation();
  const composerRuntime = useComposerRuntime();
  const { resetTranscript } = useSpeechRecognition();
  const [isVisible, setIsVisible] = useState(false);
  const [isRememberModalOpen, setIsRememberModalOpen] = useState(false);
  const [rememberContext, setRememberContext] = useState('');
  const isSubmittingRef = useRef(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState(composerRuntime.getState().text);
  const isRecordingActiveRef = useRef(false)
  useEffect(() => {
    const unsubscribe = composerRuntime.subscribe(() => {
      const newText = composerRuntime.getState().text;
      setInputValue(newText);
    });
    return unsubscribe;
  }, [composerRuntime]);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  const handleRememberSubmit = async () => {
    if (rememberContext.trim()) {
      try {
        const response = await fetch(`${backendUrl}/api/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: rememberContext }),
        });
        if (!response.ok) {
          toast.error(t('errorSavingContext', 'Failed to save context'));
          return;
        }
        toast.success(t('contextSaved', 'Context saved successfully'));
        setRememberContext('');
        setIsRememberModalOpen(false);
      } catch (error) {
        console.error('Error saving context:', error);
      }
    }
  };
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      composerRuntime.setText(newValue);
    },
    [composerRuntime]
  );
  const handleVoiceStart = useCallback(() => {
    isRecordingActiveRef.current = true; 
    setIsVoiceRecording(true);
    composerRuntime.setText('');
    setInputValue('');
  }, [composerRuntime]);
  const handleVoiceStop = useCallback(() => {
    isRecordingActiveRef.current = false;
    SpeechRecognition.stopListening();
    setIsVoiceRecording(false);
  }, []);
  const handleSubmit = (submitValue: string) => {
    if (isSubmittingRef.current || !submitValue.trim()) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    const textToSend = submitValue.trim();
    console.log("Submitting:", textToSend);
    composerRuntime.send();
    composerRuntime.setText("");
    setInputValue("");
    resetTranscript();
    setTimeout(() => {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }, 500);
  };
  const isSubmitEnabled = inputValue.trim().length > 0 && !submitting && !isVoiceRecording;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      <ComposerPrimitive.Root className="flex flex-wrap items-center px-4 py-3 w-full rounded-xl border shadow-sm transition-colors ease-in bg-card border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-center items-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:bg-muted">
              <PlusIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-1">
            <DropdownMenuItem
              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-muted focus:bg-muted outline-none"
              onClick={() => setIsRememberModalOpen(true)}
            >
              <BrainIcon className="mr-2 w-4 h-4" />
              <span>{t('remember')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ComposerPrimitive.Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t('askAboutWastewaterTreatment')}
          disabled={isVoiceRecording || submitting}
          className="flex-grow py-1 max-h-40 text-base bg-transparent border-none outline-none resize-none text-foreground placeholder-muted-foreground focus:ring-0 disabled:cursor-not-allowed"
        />
        <VoiceRecorder
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          onTranscriptChange={(transcript) => {
            if (isRecordingActiveRef.current && !submitting) {
              composerRuntime.setText(transcript);
              setInputValue(transcript);
            }
          }}
        />
        <ComposerAction
          onSubmit={() => handleSubmit(inputValue)}
          isSubmitEnabled={isSubmitEnabled}
        />
      </ComposerPrimitive.Root>
      <Dialog open={isRememberModalOpen} onOpenChange={setIsRememberModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rememberDialogTitle')}</DialogTitle>
            <DialogDescription>{t('rememberDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Textarea
              value={rememberContext}
              onChange={(e) => setRememberContext(e.target.value)}
              placeholder={t('rememberDialogPlaceholder')}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsRememberModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleRememberSubmit} disabled={!rememberContext.trim()}>
              {t('rememberButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
export default Composer;
interface ComposerActionProps {
  onSubmit: () => void;
  isSubmitEnabled: boolean;
}
const ComposerAction: React.FC<ComposerActionProps> = ({ onSubmit, isSubmitEnabled }) => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <TooltipIconButton
          tooltip="Send"
          onClick={onSubmit}
          variant="default"
          disabled={!isSubmitEnabled}
          className={`p-2 my-1 rounded-lg transition-colors ease-in text-primary-foreground bg-primary size-9 hover:bg-primary/90 ${
            !isSubmitEnabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <SendHorizontalIcon />
        </TooltipIconButton>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button
            className="p-2 my-1 rounded-lg transition-colors ease-in text-destructive-foreground bg-destructive size-9 hover:bg-destructive/90"
            title="Cancel"
          >
            <CircleStopIcon />
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};
const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className='flex flex-col w-full max-w-[var(--thread-max-width)] py-4 gap-2'>
      <div className='flex gap-3 items-center'>
        <Avatar className='mt-1 w-8 h-8 rounded-full border border-border'>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className='rounded-full bg-secondary text-secondary-foreground'>
            {user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className='font-medium break-words textbase'>
          <MessagePrimitive.Content />
        </div>
        <UserActionBar />
      </div>
      <div className='flex items-center pl-11'>
        <BranchPicker className='ml-auto' />
      </div>
    </MessagePrimitive.Root>
  );
};
const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide='not-last'
      className='flex gap-1 items-center text-muted-foreground'>
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton
          tooltip='Edit'
          className='hover:text-accent-foreground'>
          <PencilIcon className='w-4 h-4' />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};
const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className='my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl border border-border bg-muted p-4'>
      <ComposerPrimitive.Input className='flex w-full min-h-[80px] bg-transparent outline-none resize-none text-foreground p-0' />
      <div className='flex gap-2 justify-end items-center'>
        <ComposerPrimitive.Cancel asChild>
          <Button
            variant='ghost'
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive'>
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button className='text-primary-foreground bg-primary hover:bg-primary/90'>
            Save
          </Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};
const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className='flex flex-col w-full max-w-[var(--thread-max-width)] py-4 gap-2'>
      <div className='flex gap-3 items-start'>
        <Avatar className='mt-1 w-8 h-8 rounded-full border bg-primary/10 border-border'>
          <AvatarImage alt='Assistant' />
          <AvatarFallback className='rounded-full bg-primary text-accent-foreground'>
            <DropletIcon className='w-4 h-4' />
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <div className='text-base leading-relaxed break-words'>
            <MessagePrimitive.Content
              components={{
                Text: MarkdownText,
                tools: { Fallback: ToolFallback },
              }}
            />
          </div>
        </div>
      </div>
      <div className='flex items-center pl-11'>
        <AssistantActionBar />
        <BranchPicker className='ml-auto' />
      </div>
    </MessagePrimitive.Root>
  );
};
const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide='not-last'
      autohideFloat='single-branch'
      className='flex gap-2 items-center text-muted-foreground'>
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton
          tooltip='Copy'
          className='hover:text-accent-foreground'>
          <MessagePrimitive.If copied>
            <CheckIcon className='w-4 h-4' />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon className='w-4 h-4' />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton
          tooltip='Refresh'
          className='hover:text-accent-foreground'>
          <RefreshCwIcon className='w-4 h-4' />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};
const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'inline-flex items-center text-xs text-slate-500',
        className
      )}
      {...rest}>
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip='Previous' className='hover:text-blue-500'>
          <ChevronLeftIcon className='w-4 h-4' />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className='mx-1 font-medium'>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip='Next' className='hover:text-blue-500'>
          <ChevronRightIcon className='w-4 h-4' />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};