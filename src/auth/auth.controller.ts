import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const base = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

@Controller('auth')
export class AuthController {
  /** Sign up -> Supabase sends confirm email, redirects back to `${APP_URL}/auth?confirmed=1` */
  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const origin = process.env.APP_URL ?? 'http://localhost:5173';
    const { data, error } = await base().auth.signUp({
      email: body.email,
      password: body.password,
      options: { emailRedirectTo: `${origin}/auth?confirmed=1` },
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ status: 'ok', needsEmailConfirm: !data.session });
  }

  /** Login -> set Supabase access token in HttpOnly cookie `sb` */
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const { data, error } = await base().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return res.status(401).json({ error: error.message });

    const token = data.session?.access_token;
    if (!token) return res.status(401).json({ error: 'No session' });

    const prod = process.env.NODE_ENV === 'production';
    // For cross-site (pages.dev ↔ render.com) you MUST use sameSite:'none' + secure:true
    res.cookie('sb', token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/', // be explicit
    });

    return res.json({ ok: true });
  }

  /** Logout -> clear cookie (use same attributes as set) */
  @Post('logout')
  async logout(@Res() res: Response) {
    const prod = process.env.NODE_ENV === 'production';
    res.clearCookie('sb', {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ ok: true });
  }

  /** Return basic user info if logged in */
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
      },
    );

    const { data } = await client.auth.getUser();
    if (!data.user) return res.json({ authenticated: false });
    return res.json({ authenticated: true, email: data.user.email });
  }
}
