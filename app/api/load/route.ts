import { NextRequest, NextResponse } from 'next/server';
import { encodePayload, getBCVerify, setSession } from '../../../lib/auth';
import { env } from '../../../lib/env';
import { logger } from '../../../lib/logger';
 
export async function GET (req: NextRequest) {
    try {
        logger.info('Verifying app on load');
        // Verify when app loaded (launch)
        const { searchParams } = new URL(req.url);

        const session = await getBCVerify(Object.fromEntries(searchParams));
        const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering
        
        await setSession(session);
        
        const baseUrl = (env.BASE_URL || '').replace(/\/+$/, ''); // Remove trailing slashes
        const redirectUrl = `${baseUrl}/?context=${encodedContext}`;

        logger.info('Redirecting after verification', { redirectUrl: redirectUrl.substring(0, 50) + '...' });

        return NextResponse.redirect(redirectUrl, 302);
    } catch (error: unknown) {
        logger.error('Verification failed', error);
        const message = error instanceof Error ? error.message : 'Something went wrong';
        const status = (error as { response?: { status?: number } })?.response?.status || 500;

        return NextResponse.json(
            { message },
            { status }
        );
    }
}