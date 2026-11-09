import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatReply {
  answer: string;
  model: string;
}

export interface ModelsResponse {
  models: string[];
  defaultModel: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  send(prompt: string, model: string): Observable<ChatReply> {
    return this.http.post<ChatReply>('/api/chat', { message: prompt, model });
  }

  listModels(): Observable<ModelsResponse> {
    return this.http.get<ModelsResponse>('/api/models');
  }
}
