import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express'

@Injectable()
export class SupabaseService {
  forRequest(req: Request): SupabaseClient {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const cookie = (req as any).cookies?.sb as string | undefined;
    const token = bearer ?? cookie;

    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
  }
}
