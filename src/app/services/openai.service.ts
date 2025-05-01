import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  constructor(private http: HttpClient) {}

  analyzeFood(imageBase64: string): Observable<any> {
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;
    
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${environment.openAiApiKey}`);

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food and return ONLY valid JSON in this format: {\"name\":\"Food Name\",\"calories\":000,\"protein\":00,\"carbs\":00,\"fat\":00}. If no food visible, return: {\"error\":\"No food detected\"}"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    };

    return this.http.post(apiUrl, payload, { headers }).pipe(
      map((response: any) => {
        const text = response?.choices?.[0]?.message?.content?.trim();
        if (!text) return { error: "No response content" };
        
        console.log('API response text:', text);
        
        try {
          const jsonMatch = text.match(/\{.*\}/s);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          return { 
            error: "Invalid JSON response", 
            rawText: text 
          };
        }
      }),
      catchError(error => {
        console.error('API call failed:', error);
        return throwError(() => ({
          error: "API request failed",
          details: error.error || error.message || error
        }));
      })
    );
  }
}