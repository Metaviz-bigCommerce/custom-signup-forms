import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { successResponse, apiErrors } from '@/lib/api-response';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const logContext = { requestId };
  
  try {
    const session = await getSession(req);
    if (!session) {
      return apiErrors.unauthorized(requestId);
    }
    
    const { storeHash } = session;
    
    // Fetch all requests with pagination to get accurate stats
    const allItems: Array<{ status: string; submittedAt?: { seconds?: number; nanoseconds?: number } | string }> = [];
    let cursor: string | null = null;
    let hasMore = true;
    
    while (hasMore) {
      const result = await db.listSignupRequests(storeHash, { 
        pageSize: 1000, 
        cursor: cursor || undefined 
      });
      
      allItems.push(...result.items);
      cursor = result.nextCursor;
      hasMore = !!cursor && result.items.length === 1000;
    }
    
    // Calculate trend: compare last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const parseDate = (dateValue: { seconds?: number; nanoseconds?: number } | string | undefined): Date | null => {
      if (!dateValue) return null;
      if (typeof dateValue === 'string') {
        return new Date(dateValue);
      }
      if (dateValue.seconds) {
        return new Date(dateValue.seconds * 1000);
      }
      return null;
    };
    
    const currentPeriodCount = allItems.filter((r) => {
      const submittedAt = parseDate(r.submittedAt);
      return submittedAt && submittedAt >= sevenDaysAgo;
    }).length;
    
    const previousPeriodCount = allItems.filter((r) => {
      const submittedAt = parseDate(r.submittedAt);
      return submittedAt && submittedAt >= fourteenDaysAgo && submittedAt < sevenDaysAgo;
    }).length;
    
    // Calculate percentage change
    let trendPercentage: number | null = null;
    let trendUp = true;
    if (previousPeriodCount > 0) {
      trendPercentage = Math.round(((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100);
      trendUp = trendPercentage >= 0;
    } else if (currentPeriodCount > 0) {
      // If previous period had 0 but current has signups, show 100%+ growth
      trendPercentage = 100;
      trendUp = true;
    }
    
    const stats = {
      total: allItems.length,
      pending: allItems.filter((r: { status: string }) => r.status === 'pending').length,
      approved: allItems.filter((r: { status: string }) => r.status === 'approved').length,
      rejected: allItems.filter((r: { status: string }) => r.status === 'rejected').length,
      trend: trendPercentage !== null ? (trendUp ? '+' : '') + trendPercentage + '%' : null,
      trendUp,
    };
    
    return successResponse(stats, 200, requestId);
  } catch (error: unknown) {
    logger.error('Failed to get signup request stats', error, logContext);
    return apiErrors.internalError('Failed to retrieve stats', error, requestId);
  }
}

