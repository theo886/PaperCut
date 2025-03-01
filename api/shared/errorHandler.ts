import { Context } from '@azure/functions';
import { ApiResponse } from './types';

/**
 * Standard error handler for Azure Function errors
 * @param context The Azure Function context
 * @param error The error that occurred
 * @param defaultMessage Default message to display if error doesn't have a message
 */
export default function errorHandler(
  context: Context, 
  error: any, 
  defaultMessage = 'An unexpected error occurred'
): void {
  context.log.error('Error:', error);

  context.res = {
    status: error.status || 500,
    headers: { 'Content-Type': 'application/json' },
    body: { message: error.message || defaultMessage }
  } as ApiResponse;
} 