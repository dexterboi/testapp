import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-owner-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: any = {}
    try { body = await req.json() || {} } catch { /* leave body {} */ }

    // Token: body (avoids CORS on custom headers) > X-Owner-Token > Authorization Bearer
    const token = (typeof body === 'object' && body && body.owner_token) ||
      req.headers.get('X-Owner-Token') || req.headers.get('x-owner-token') ||
      (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token. Send X-Owner-Token or Authorization: Bearer <access_token>' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'Authorization': `Bearer ${supabaseServiceKey}` } }
    })

    // Verify owner via service-role client (avoids REST/PostgREST 401 on custom tokens)
    const { data: profiles, error: verifyErr } = await supabaseService
      .from('user_profiles')
      .select('id, role')
      .eq('access_token', token)
      .eq('role', 'owner')
      .limit(1)
    const profile = (profiles && profiles[0]) || null
    if (verifyErr || !profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid token: No owner found with this token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method } = req

    if (method === 'POST') {
      const { name, match_duration, buffer_minutes } = body
      if (!name || match_duration == null) {
        return new Response(
          JSON.stringify({ error: 'name and match_duration are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const insertData = {
        owner_id: profile.id,
        name: String(name).trim(),
        match_duration: Math.min(180, Math.max(30, parseInt(String(match_duration), 10) || 60)),
        buffer_minutes: buffer_minutes != null ? Math.min(60, Math.max(0, parseInt(String(buffer_minutes), 10) || 15)) : 15,
      }
      const { data, error } = await supabaseService
        .from('sport_types')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (method === 'PUT') {
      const { id, name, match_duration, buffer_minutes } = body
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { data: existing } = await supabaseService
        .from('sport_types')
        .select('owner_id')
        .eq('id', id)
        .single()

      if (!existing || existing.owner_id !== profile.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Not the owner of this sport type' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updateData: any = {}
      if (name !== undefined) updateData.name = String(name).trim()
      if (match_duration != null) updateData.match_duration = Math.min(180, Math.max(30, parseInt(String(match_duration), 10) || 60))
      if (buffer_minutes != null) updateData.buffer_minutes = Math.min(60, Math.max(0, parseInt(String(buffer_minutes), 10) || 15))

      const { data, error } = await supabaseService
        .from('sport_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (method === 'DELETE') {
      const { id } = body
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { data: existing } = await supabaseService
        .from('sport_types')
        .select('owner_id')
        .eq('id', id)
        .single()

      if (!existing || existing.owner_id !== profile.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Not the owner of this sport type' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseService
        .from('sport_types')
        .delete()
        .eq('id', id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
