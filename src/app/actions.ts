'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// 1. Get all study sessions with creator and subject info
export async function getStudySessions() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      users!creator_id(nama),
      subjects(subject_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data;
}

// 2. Create a study session
export async function createStudySession(formData: FormData) {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Anda harus login!' };
  }

  const title = formData.get('title') as string;
  const location = formData.get('location') as string;
  const time = formData.get('time') as string;
  const max_capacity = parseInt(formData.get('max_capacity') as string, 10);
  const subject_id = formData.get('subject_id') as string;
  
  const creator_id = user.id;

  if (!title || !location || !time || !max_capacity || !subject_id) {
    return { success: false, error: 'Semua field harus diisi!' };
  }

  if (max_capacity < 2 || max_capacity > 50) {
    return { success: false, error: 'Kapasitas harus antara 2-50!' };
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert([
      { title, location, time, max_capacity, subject_id, creator_id, current_capacity: 0 }
    ])
    .select();

  if (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, data };
}

// 3. Join a session (Create Participant)
export async function joinSession(session_id: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Anda harus login!' };
  }

  const user_id = user.id;

  // First, check if session is full
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .select('id, max_capacity, current_capacity')
    .eq('id', session_id)
    .single();

  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    return { success: false, error: 'Sesi tidak ditemukan!' };
  }

  if (session.current_capacity >= session.max_capacity) {
    return { success: false, error: 'Sesi sudah penuh!' };
  }

  // Try to join
  const { data, error } = await supabase
    .from('participants')
    .insert([
      { session_id, user_id }
    ])
    .select();

  if (error) {
    console.error('Error joining session:', error);

    if (error.code === '23505') {
      return { success: false, error: 'Anda sudah terdaftar di sesi ini!' };
    }

    if (error.code === '23503') {
      return { success: false, error: 'User atau sesi tidak valid!' };
    }

    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, data };
}

// 4. Leave a session (Delete Participant)
export async function leaveSession(session_id: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Anda harus login!' };
  }

  const user_id = user.id;

  const { error } = await supabase
    .from('participants')
    .delete()
    .match({ session_id, user_id });

  if (error) {
    console.error('Error leaving session:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

// 5. Get all subjects
export async function getSubjects() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('subject_name');

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
  return data;
}

// 6. Get sessions by user
export async function getMySessions() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      users!creator_id(nama),
      subjects(subject_name)
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my sessions:', error);
    return [];
  }
  return data;
}

// 7. Get joined sessions for a user
export async function getMyJoinedSessions(): Promise<Array<{
  id: string;
  title: string;
  max_capacity: number;
  current_capacity: number;
  time: string;
  location: string;
  created_at: string;
  creator_id: string;
  users?: { nama: string } | null;
  subjects?: { subject_name: string } | null;
  joined_at: string;
}>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('participants')
    .select(`
      session_id,
      joined_at,
      study_sessions!inner(
        id,
        title,
        max_capacity,
        current_capacity,
        time,
        location,
        created_at,
        creator_id,
        users!creator_id(nama),
        subjects(subject_name)
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching joined sessions:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((p: any) => ({
    id: p.session_id,
    title: p.study_sessions.title,
    max_capacity: p.study_sessions.max_capacity,
    current_capacity: p.study_sessions.current_capacity,
    time: p.study_sessions.time,
    location: p.study_sessions.location,
    created_at: p.study_sessions.created_at,
    creator_id: p.study_sessions.creator_id,
    users: p.study_sessions.users,
    subjects: p.study_sessions.subjects,
    joined_at: p.joined_at
  }));
}

// 8. Get current user profile
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
  return data;
}

// 9. Get messages for a session
export async function getMessages(session_id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      users(nama)
    `)
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data;
}

// 10. Send a message
export async function sendMessage(
  session_id: string, 
  content: string, 
  attachment_url?: string, 
  attachment_type?: 'image' | 'audio'
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Anda harus login!' };

  const { data, error } = await supabase
    .from('messages')
    .insert([
      { 
        session_id, 
        user_id: user.id, 
        content,
        attachment_url,
        attachment_type
      }
    ])
    .select();

  if (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 11. Delete a message
export async function deleteMessage(message_id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Anda harus login!' };

  const { error } = await supabase
    .from('messages')
    .delete()
    .match({ id: message_id, user_id: user.id });

  if (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

