import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chat } from './chat';

describe('Chat', () => {
  let httpTesting: HttpTestingController;

  const flushModels = () => {
    httpTesting.expectOne('/api/models').flush({
      models: ['llama3.2:1b', 'llama3.2:3b'],
      defaultModel: 'llama3.2:3b',
    });
  };

  const createChat = (): ComponentFixture<Chat> => {
    const fixture = TestBed.createComponent(Chat);
    fixture.detectChanges();
    flushModels();
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    const fixture = createChat();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should send a prompt and render the reply', () => {
    const fixture = createChat();

    const suggestion = fixture.nativeElement.querySelector('.suggestion') as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.message-user')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.typing-bubble')).toBeTruthy();

    const request = httpTesting.expectOne('/api/chat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      message: 'Explain retrieval-augmented generation in simple terms.',
      model: 'llama3.2:3b',
    });

    request.flush({ answer: 'RAG answer', model: 'llama3.2:3b' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.message').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.typing-bubble')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('RAG answer');
    expect(fixture.nativeElement.querySelector('.model-pill').textContent).toContain('llama3.2:3b');
  });

  it('should send the selected model with the prompt', () => {
    const fixture = createChat();

    const select = fixture.nativeElement.querySelector('.model-select') as HTMLSelectElement;
    select.value = 'llama3.2:1b';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const suggestion = fixture.nativeElement.querySelector('.suggestion') as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();

    const request = httpTesting.expectOne('/api/chat');
    expect(request.request.body).toEqual({
      message: 'Explain retrieval-augmented generation in simple terms.',
      model: 'llama3.2:1b',
    });

    request.flush({ answer: 'Small model answer', model: 'llama3.2:1b' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Small model answer');
  });
});
