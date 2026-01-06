import { NextRequest, NextResponse } from 'next/server';
import { encodePayload, getBCAuth, setSession } from '../../../lib/auth';
import { env } from '../../../lib/env';
import { logger } from '../../../lib/logger';

export async function GET (req: NextRequest) {
    try {
        logger.info('Authenticating app on install');
        // Authenticate the app on install
        const { searchParams } = new URL(req.url);

        const session = await getBCAuth(Object.fromEntries(searchParams));
        const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering

        await setSession(session);

        // Once the app has been authorized, redirect
        const baseUrl = (env.BASE_URL || '').replace(/\/+$/, ''); // Remove trailing slashes
        const redirectUrl = `${baseUrl}/?context=${encodedContext}`;

        logger.info('Redirecting after authentication', { redirectUrl: redirectUrl.substring(0, 50) + '...' });

        return NextResponse.redirect(redirectUrl, 302);
    } catch (error: unknown) {
        logger.error('Authentication failed', error);
        const message = error instanceof Error ? error.message : 'Something went wrong';
        const status = (error as { response?: { status?: number } })?.response?.status || 500;

        return NextResponse.json(
            { message },
            { status }
        );
    }
}