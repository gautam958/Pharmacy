import { HttpErrorResponse } from '@angular/common/http';

// Turns the different error shapes coming from the api into one readable message
export function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Could not connect to the server. Is the API running?';
  }

  const body = error.error;
  if (body?.message) {
    return body.message;
  }

  if (body?.errors) {
    const messages = Object.values(body.errors as Record<string, string[]>).flat();
    return messages.join(' ');
  }

  return 'Something went wrong. Please try again.';
}
