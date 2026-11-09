import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ChatService } from './chat.service';
import { ChatMessage, ChatRole } from './chat.types';
import { MarkdownPipe } from './markdown.pipe';

interface Suggestion {
  title: string;
  description: string;
  prompt: string;
}

@Component({
  selector: 'app-chat',
  imports: [MarkdownPipe],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly chatService = inject(ChatService);
  private readonly injector = inject(Injector);
  private readonly messageList = viewChild<ElementRef<HTMLElement>>('messageList');
  private readonly composer = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  protected readonly model = signal('llama3.2:3b');
  protected readonly models = signal<string[]>(['llama3.2:3b']);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly isReplying = signal(false);
  protected readonly canSend = computed(() => this.draft().trim().length > 0 && !this.isReplying());

  protected readonly suggestions: Suggestion[] = [
    {
      title: 'Explain RAG',
      description: 'How retrieval-augmented generation grounds answers',
      prompt: 'Explain retrieval-augmented generation in simple terms.',
    },
    {
      title: 'Plan a RAG pipeline',
      description: 'Chunking, embeddings, and pgvector retrieval',
      prompt: 'What are the steps to build a RAG pipeline with PostgreSQL and pgvector?',
    },
    {
      title: 'Agent safety',
      description: 'Keep tool calls validated and permissioned',
      prompt: 'How do I keep a tool-using agent safe?',
    },
    {
      title: 'Safe text-to-SQL',
      description: 'Let users query data without risking the database',
      prompt: 'How would I safely let a user query PostgreSQL in natural language?',
    },
  ];

  constructor() {
    this.loadModels();
  }

  protected onModelChange(event: Event): void {
    this.model.set((event.target as HTMLSelectElement).value);
  }

  protected onDraftInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.draft.set(textarea.value);
    this.resizeComposer(textarea);
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected send(prompt = this.draft()): void {
    const content = prompt.trim();
    if (!content || this.isReplying()) {
      return;
    }

    this.appendMessage('user', content);
    this.draft.set('');
    this.resetComposer();
    this.isReplying.set(true);
    this.scrollToBottom();

    this.chatService.send(content, this.model()).subscribe({
      next: (reply) => {
        this.isReplying.set(false);
        this.model.set(reply.model);
        this.appendMessage('assistant', reply.answer);
      },
      error: () => {
        this.isReplying.set(false);
        this.appendMessage(
          'assistant',
          'I could not reach the model. Check that the API and Ollama are running, then try again.',
        );
      },
    });
  }

  protected startNewChat(): void {
    this.messages.set([]);
    this.draft.set('');
    this.isReplying.set(false);
    this.resetComposer();
    this.composer()?.nativeElement.focus();
  }

  protected formatTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  private loadModels(): void {
    this.chatService.listModels().subscribe({
      next: (response) => {
        const names = Array.from(new Set([response.defaultModel, ...response.models]));

        if (names.length > 0) {
          this.models.set(names);

          if (!names.includes(this.model())) {
            this.model.set(response.defaultModel);
          }
        }
      },
      error: () => {
        // Keep the current model selectable if discovery fails.
      },
    });
  }

  private appendMessage(role: ChatRole, content: string): void {
    this.messages.update((messages) => [
      ...messages,
      {
        id: this.createId(),
        role,
        content,
        createdAt: new Date(),
      },
    ]);
    this.scrollToBottom();
  }

  private resizeComposer(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  private resetComposer(): void {
    const textarea = this.composer()?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  private scrollToBottom(): void {
    afterNextRender(
      () => {
        const element = this.messageList()?.nativeElement;
        element?.scrollTo?.({ top: element.scrollHeight, behavior: 'smooth' });
      },
      { injector: this.injector },
    );
  }

  private createId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
