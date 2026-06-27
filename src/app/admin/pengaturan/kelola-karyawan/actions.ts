'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getKaryawan() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('karyawan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Jika tabel belum ada, Supabase mengembalikan pesan error (PGRST204)
            if (error.code === 'PGRST204' || error.message.includes('relation "public.karyawan" does not exist')) {
                 return { success: false, data: [], error: 'TABLE_NOT_FOUND' };
            }
            throw error;
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('Error fetching karyawan:', err);
        return { success: false, data: [], error: err.message };
    }
}

export async function upsertKaryawan(formData: any) {
    try {
        const supabase = await createClient();
        
        const payload = {
            nama: formData.nama,
            nik: formData.nik,
            jabatan: formData.jabatan,
            unit: Array.isArray(formData.unit) ? formData.unit.join(', ') : formData.unit,
            no_hp: formData.no_hp,
            email: formData.email,
            alamat: formData.alamat,
            is_active: formData.is_active ?? true,
            updated_at: new Date().toISOString(),
        };

        let result;
        if (formData.id) {
            // Update
            result = await supabase
                .from('karyawan')
                .update(payload)
                .eq('id', formData.id);
        } else {
            // Insert
            result = await supabase
                .from('karyawan')
                .insert([payload]);
        }

        if (result.error) throw result.error;

        revalidatePath('/admin/pengaturan/kelola-karyawan');
        return { success: true };
    } catch (err: any) {
        console.error('Error upserting karyawan:', err);
        return { success: false, error: err.message };
    }
}

export async function toggleKaryawanStatus(id: string, isActive: boolean) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('karyawan')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/pengaturan/kelola-karyawan');
        return { success: true };
    } catch (err: any) {
        console.error('Error toggling status:', err);
        return { success: false, error: err.message };
    }
}

export async function deleteKaryawan(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('karyawan')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/pengaturan/kelola-karyawan');
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting karyawan:', err);
        return { success: false, error: err.message };
    }
}
