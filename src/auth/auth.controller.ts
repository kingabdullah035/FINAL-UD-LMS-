import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const base = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

@Controller('auth')
export class AuthController {
  /**
   * Sign up a user. Sends Supabase confirm email.
   * After confirmation, Supabase will redirect back to `${APP_URL}/auth?confirmed=1`.
   */
  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string },
    @Res() res: Response
  ) {
    const origin = process.env.APP_URL ?? 'http://localhost:5173';
    const { data, error } = await base().auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${origin}/auth?confirmed=1`,
      },
    });
    if (error) return res.status(400).json({ error: error.message });
    // If your Supabase project doesn't require email confirm, data.session may be present.
    return res.json({ status: 'ok', needsEmailConfirm: !data.session });
  }

  /**
   * Login with email/password.
   * Stores the Supabase access token as an HttpOnly cookie named "sb".
   */
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response
  ) {
    const { data, error } = await base().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return res.status(401).json({ error: error.message });

    const token = data.session?.access_token;
    if (!token) return res.status(401).json({ error: 'No session' });

    // In production, set secure: true
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('sb', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return res.json({ ok: true });
  }

  /**
   * Clear the session cookie.
   */
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('sb');
    return res.json({ ok: true });
  }

  /**
   * Return basic user info if logged in (used by the frontend to gate routes).
   */
  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
    const token = (req as any).cookies?.sb as string | undefined;
    if (!token) return res.json({ authenticated: false });

    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return res.json({ authenticated: false });

    return res.json({ authenticated: true, email: data.user.email });
  }
}
